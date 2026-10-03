import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Table, Badge, Modal } from 'react-bootstrap';
import { 
  Ticket, Plus, CheckCircle, Clock, Search, Edit3, Trash2, 
  User, Filter, FileText, AlertCircle, XCircle, ArrowRight,
  Eye, RefreshCw, Download, Check, Wrench, Droplets, Zap,
  Wind, ShieldAlert, Cpu, ChevronRight, X, MessageSquare,
  Send, Calendar, MapPin, Building, AlertTriangle, ArrowUpRight,
  LayoutGrid, ListFilter, SlidersHorizontal, Sparkles, CheckCheck,
  RotateCcw, Copy, Activity, Layers, Flame, ShieldCheck,
  TrendingUp, BarChart3, Users, ChevronDown, CheckCircle2,
  ExternalLink, ArrowDownRight, Radio, Bell, Leaf, Thermometer,
  Database, Gauge, PenTool, LayoutDashboard, CornerDownRight
} from 'lucide-react';

// Exact Sidebar Facilities with their full sub-items (Kis pe complain karna hai)
const SIDEBAR_FACILITIES = {
  'Energy Metering': { 
    icon: Zap, 
    color: '#60a5fa', 
    bg: 'rgba(96, 165, 250, 0.12)', 
    border: 'rgba(96, 165, 250, 0.3)',
    glow: 'rgba(96, 165, 250, 0.25)',
    subItems: [
      { name: 'Main Meter', desc: 'Main incoming HT/LT incomer energy meter' },
      { name: 'Sub Meters', desc: 'Tenant, floor-wise, and distribution sub-meters' },
      { name: 'Graphs / Power Quality', desc: 'Harmonics, power factor, voltage/current spikes' },
      { name: 'Feeder Distribution', desc: 'Outgoing feeders, breaker contacts' }
    ]
  },
  'DG Set': { 
    icon: Database, 
    color: '#c084fc', 
    bg: 'rgba(192, 132, 252, 0.12)', 
    border: 'rgba(192, 132, 252, 0.3)',
    glow: 'rgba(192, 132, 252, 0.25)',
    subItems: [
      { name: 'DG Set-1', desc: 'Generator unit 1 engine, lube oil, cooling circuit' },
      { name: 'DG Set-2', desc: 'Generator unit 2 engine, alternator, synchronizer' },
      { name: 'Fuel Level & Day Tank', desc: 'Diesel storage, transfer pump, float sensor' },
      { name: 'Alternator & Battery', desc: 'Starting batteries, excitation control, AVR' }
    ]
  },
  'LT Panel': { 
    icon: LayoutDashboard, 
    color: '#fbbf24', 
    bg: 'rgba(251, 191, 36, 0.12)', 
    border: 'rgba(251, 191, 36, 0.3)',
    glow: 'rgba(251, 191, 36, 0.25)',
    subItems: [
      { name: 'Breaker Status (ACB / VCB)', desc: 'Air circuit breakers, shunt trips, spring charge' },
      { name: 'Incoming / Outgoing', desc: 'Bus couplers, busbar joints, outgoing switches' },
      { name: 'LT Room 1 Panel', desc: 'Main low-tension switchgear room 1' },
      { name: 'LT Room 2 Panel', desc: 'Auxiliary low-tension switchgear room 2' },
      { name: 'APFC Capacitor Bank', desc: 'Capacitor steps, reactive power controller' }
    ]
  },
  'Transformer': { 
    icon: Zap, 
    color: '#fb923c', 
    bg: 'rgba(251, 146, 60, 0.12)', 
    border: 'rgba(251, 146, 60, 0.3)',
    glow: 'rgba(251, 146, 60, 0.25)',
    subItems: [
      { name: 'Transformer-1', desc: '11kV/415V 2MVA step-down transformer 1' },
      { name: 'Transformer-2', desc: '11kV/415V 2MVA step-down transformer 2' },
      { name: 'Load / Temp Monitoring', desc: 'Winding (WTI) and oil (OTI) temperature sensors' },
      { name: 'Oil Level & Buchholz', desc: 'Conservator tank level, silica gel breather' }
    ]
  },
  'HVAC': { 
    icon: Thermometer, 
    color: '#38bdf8', 
    bg: 'rgba(56, 189, 248, 0.12)', 
    border: 'rgba(56, 189, 248, 0.3)',
    glow: 'rgba(56, 189, 248, 0.25)',
    subItems: [
      { name: 'Chiller', desc: 'Centrifugal / screw chillers, compressor, evaporator' },
      { name: 'AHU', desc: 'Air handling units, supply fans, cooling coils, filters' },
      { name: 'Cooling Tower', desc: 'Induced draft fans, water basin level, drift eliminators' },
      { name: 'Chilled Water Pumps', desc: 'Primary & secondary chilled water pumps' }
    ]
  },
  'VRV': { 
    icon: Wind, 
    color: '#38bdf8', 
    bg: 'rgba(56, 189, 248, 0.12)', 
    border: 'rgba(56, 189, 248, 0.3)',
    glow: 'rgba(56, 189, 248, 0.25)',
    subItems: [
      { name: 'Control Panel', desc: 'Central touch controller, master network interface' },
      { name: 'VRV Outdoor Condenser', desc: 'Inverter compressor, condenser fan, expansion loop' },
      { name: 'Indoor Units (FCU)', desc: 'Ceiling cassette FCUs, electronic expansion valve' },
      { name: 'Human Sensor / Schedule', desc: 'Occupancy motion sensors, setpoint schedule' }
    ]
  },
  'AC': { 
    icon: Wind, 
    color: '#60a5fa', 
    bg: 'rgba(96, 165, 250, 0.12)', 
    border: 'rgba(96, 165, 250, 0.3)',
    glow: 'rgba(96, 165, 250, 0.25)',
    subItems: [
      { name: 'Precision AC (PAC)', desc: 'Data center / server room close control AC unit' },
      { name: 'Split AC Units', desc: 'Wall-mounted split AC units, gas charge, filters' },
      { name: 'Ductable AC Units', desc: 'Concealed ceiling ductable units, thermostat' }
    ]
  },
  'AQI Sensor': { 
    icon: Leaf, 
    color: '#2dd4bf', 
    bg: 'rgba(45, 212, 191, 0.12)', 
    border: 'rgba(45, 212, 191, 0.3)',
    glow: 'rgba(45, 212, 191, 0.25)',
    subItems: [
      { name: 'PM2.5 / PM10 Sensor', desc: 'Laser optical particulate dust sensor probe' },
      { name: 'CO2 / TVOC Monitor', desc: 'NDIR carbon dioxide & volatile organic compound sensor' },
      { name: 'Outdoor Environmental Station', desc: 'Rooftop ambient weather & AQI telemetry node' }
    ]
  },
  'Water Management': { 
    icon: Droplets, 
    color: '#38bdf8', 
    bg: 'rgba(56, 189, 248, 0.12)', 
    border: 'rgba(56, 189, 248, 0.3)',
    glow: 'rgba(56, 189, 248, 0.25)',
    subItems: [
      { name: 'AG TANK (Above Ground / OHT)', desc: 'Overhead raw & treated water storage tank level' },
      { name: 'UG TANK (Underground Reservoir)', desc: 'Underground sump, motorized inlet filling valve' },
      { name: 'Domestic / Flushing Supply', desc: 'Distribution risers, dual plumbing valves, flow' },
      { name: 'Booster Pumps', desc: 'Variable speed hydro-pneumatic booster pump set' }
    ]
  },
  'Motors': { 
    icon: Activity, 
    color: '#2dd4bf', 
    bg: 'rgba(45, 212, 191, 0.12)', 
    border: 'rgba(45, 212, 191, 0.3)',
    glow: 'rgba(45, 212, 191, 0.25)',
    subItems: [
      { name: 'VFD / DOL Status', desc: 'Variable frequency drives, direct-on-line starters' },
      { name: 'Pump Room 1 Motors', desc: 'Primary water circulation and delivery motor set' },
      { name: 'Pump Room 2 Motors', desc: 'Secondary booster and sewage dewatering motors' },
      { name: 'Submersible Sump Pump', desc: 'Basement stormwater & sewage pit discharge pumps' }
    ]
  },
  'ACMS': { 
    icon: ShieldAlert, 
    color: '#ef4444', 
    bg: 'rgba(239, 68, 68, 0.12)', 
    border: 'rgba(239, 68, 68, 0.3)',
    glow: 'rgba(239, 68, 68, 0.25)',
    subItems: [
      { name: 'Main Fire Pump', desc: 'Electric motor driven high-pressure fire hydrant pump' },
      { name: 'Jockey / Main', desc: 'Pressure maintenance jockey pump, pressure switches' },
      { name: 'Header Pressure Line', desc: 'Fire ring main header pressure transducer, NRVs' },
      { name: 'Pump Status / Starter', desc: 'Automatic fire pump starter control panel & battery' }
    ]
  },
  'Alarm System': { 
    icon: Bell, 
    color: '#f87171', 
    bg: 'rgba(248, 113, 113, 0.12)', 
    border: 'rgba(248, 113, 113, 0.3)',
    glow: 'rgba(248, 113, 113, 0.25)',
    subItems: [
      { name: 'Optical Smoke Detector', desc: 'Addressable ceiling optical smoke & heat detectors' },
      { name: 'Fire Alarm Panel (FACP)', desc: 'Main addressable fire control panel, loop cards' },
      { name: 'Active Alarms / ACK', desc: 'Unacknowledged emergency alarms, isolation zones' },
      { name: 'Message Template / Sounders', desc: 'Emergency PA talkback, strobe sounder beacons' }
    ]
  },
  'Maintenance': { 
    icon: Wrench, 
    color: '#818cf8', 
    bg: 'rgba(129, 140, 248, 0.12)', 
    border: 'rgba(129, 140, 248, 0.3)',
    glow: 'rgba(129, 140, 248, 0.25)',
    subItems: [
      { name: 'Scheduled Tasks', desc: 'Routine preventative maintenance checklists & schedules' },
      { name: 'Pending Tasks', desc: 'Backlog maintenance work orders & repair tasks' },
      { name: 'Elevators / Lifts', desc: 'Passenger & service elevators, ARD battery backup' },
      { name: 'Civil & Architectural', desc: 'Expansion joints, waterproofing, door access hardware' }
    ]
  }
};

const INITIAL_TICKETS = [
  { 
    id: '1008', 
    subject: 'Transformer-1 Winding Over-Temperature Warning', 
    priority: 'High', 
    status: 'Open', 
    category: 'Transformer', 
    subItem: 'Transformer-1',
    asset: 'Transformer-1 (11kV/415V 2MVA)',
    location: 'Main Yard • Transformer Bay 1',
    date: '21 Apr 2026, 11:40 AM', 
    timeAgo: '15 mins ago',
    staff: 'Vikram Joshi', 
    staffAvatar: 'VJ',
    staffRole: 'High Voltage Engineer',
    sla: '4h SLA (Urgent)',
    slaTime: '3h 45m remaining',
    desc: 'Winding temperature gauge reporting 84°C under 70% load factor. Radiator cooling fan bank 2 failing to trigger automatically.',
    activity: [
      { time: '11:40 AM', user: 'OTI/WTI Sensor Telemetry', text: 'WTI alarm trip threshold approached (>85°C).' },
      { time: '11:45 AM', user: 'Control Room Dispatch', text: 'Vikram Joshi assigned to inspect fan contactor relay.' }
    ]
  },
  { 
    id: '1007', 
    subject: 'Main Fire Pump Header Line Pressure Loss', 
    priority: 'Critical', 
    status: 'In Progress', 
    category: 'ACMS', 
    subItem: 'Header Pressure Line',
    asset: 'Main Electrical Fire Pump (150kW)',
    location: 'Fire Pump Station • Basement 2',
    date: '21 Apr 2026, 10:15 AM', 
    timeAgo: '1 hour ago',
    staff: 'Rajesh Sharma', 
    staffAvatar: 'RS',
    staffRole: 'Fire Safety Lead',
    sla: '2h SLA (Emergency)',
    slaTime: '1h remaining',
    desc: 'Fire header pressure dropped from 7.5 bar to 5.2 bar. Jockey pump running continuously to maintain static head. Possible check valve leak.',
    activity: [
      { time: '10:15 AM', user: 'ACMS Telemetry', text: 'Header pressure drop warning triggered (<6.0 bar).' },
      { time: '10:30 AM', user: 'Rajesh Sharma', text: 'Isolating NRV valve on Pump 1 discharge manifold.' }
    ]
  },
  { 
    id: '1006', 
    subject: 'LT Panel Incomer ACB Trip Coil Fault', 
    priority: 'High', 
    status: 'Open', 
    category: 'LT Panel', 
    subItem: 'Breaker Status (ACB / VCB)',
    asset: 'Incomer-1 ACB Breaker 2500A',
    location: 'LT Substation 1 • Ground Floor',
    date: '21 Apr 2026, 09:10 AM', 
    timeAgo: '2 hours ago',
    staff: 'Arun Verma', 
    staffAvatar: 'AV',
    staffRole: 'Switchgear Specialist',
    sla: '4h SLA',
    slaTime: '2h remaining',
    desc: 'Self-supervision relay indicates high resistance on shunt trip coil circuit. Breaker operational but remote tripping disabled.',
    activity: [
      { time: '09:10 AM', user: 'SCADA Relay Node', text: 'Trip circuit supervision alarm.' }
    ]
  },
  { 
    id: '1005', 
    subject: 'Fire Alarm Zone 4 Optical Smoke Fault', 
    priority: 'Medium', 
    status: 'In Progress', 
    category: 'Alarm System', 
    subItem: 'Optical Smoke Detector',
    asset: 'Addressable Smoke Detector #ZD-04-12',
    location: 'Block C • 3rd Floor East Corridor',
    date: '21 Apr 2026, 07:45 AM', 
    timeAgo: '3 hours ago',
    staff: 'David Kumar', 
    staffAvatar: 'DK',
    staffRole: 'Fire Safety Officer',
    sla: '12h SLA',
    slaTime: '9h remaining',
    desc: 'Detector reporting intermittent open loop fault on Main Fire Panel Loop 2. Chamber cleaning or sensor head replacement required.',
    activity: [
      { time: '07:45 AM', user: 'Fire Panel Node 1', text: 'Intermittent loop impedance error detected on zone loop.' },
      { time: '08:15 AM', user: 'David Kumar', text: 'Dispatched to 3rd floor east corridor. Sensor head unmounted for ultrasonic chamber cleaning.' }
    ]
  },
  { 
    id: '1004', 
    subject: 'Chiller-3 Cooling Tower Fan Vibration', 
    priority: 'Critical', 
    status: 'Open', 
    category: 'HVAC', 
    subItem: 'Cooling Tower',
    asset: 'Cooling Tower #3 (Induced Draft Fan)',
    location: 'Roof Terrace • North Plant Deck',
    date: '21 Apr 2026, 11:10 AM', 
    timeAgo: '45 mins ago',
    staff: 'Alex Rivera', 
    staffAvatar: 'AR',
    staffRole: 'HVAC Specialist',
    sla: '2h SLA (Critical)',
    slaTime: '1h 15m remaining',
    desc: 'Excessive vibration telemetry (6.8 mm/s RMS) detected on fan motor shaft. Risk of blade housing collision if left unattended.',
    activity: [
      { time: '11:10 AM', user: 'Vibration Sensor Node', text: 'Critical vibration threshold exceeded (Warning: 4.5 mm/s, Tripped: 6.8 mm/s).' },
      { time: '11:15 AM', user: 'Control Dispatch', text: 'Alex Rivera assigned with high-priority dispatch order.' }
    ]
  },
  { 
    id: '1003', 
    subject: 'Main Incomer PM8000 Modbus Timeout', 
    priority: 'Low', 
    status: 'Closed', 
    category: 'Energy Metering', 
    subItem: 'Main Meter',
    asset: 'Schneider PowerLogic PM8000 Meter',
    location: 'Main Electrical Meter Room',
    date: '20 Apr 2026, 14:00 PM', 
    timeAgo: 'Yesterday',
    staff: 'Sarah Jenkins', 
    staffAvatar: 'SJ',
    staffRole: 'Energy Systems Tech',
    sla: '24h SLA',
    slaTime: 'Resolved on time',
    desc: 'RS-485 communication timeout between meter and gateway device. Baud rate re-synchronized and terminations checked.',
    activity: [
      { time: '14:00 PM (20 Apr)', user: 'Sarah Jenkins', text: 'Gateway polling cycle restored. Modbus packet loss 0%.' }
    ]
  },
  { 
    id: '1002', 
    subject: 'Domestic Water Line Low Pressure in Block B', 
    priority: 'Medium', 
    status: 'In Progress', 
    category: 'Water Management', 
    subItem: 'Domestic / Flushing Supply',
    asset: 'Hydro-Pneumatic Booster Pump #2',
    location: 'Pump House B • Basement Level',
    date: '21 Apr 2026, 08:15 AM', 
    timeAgo: '3 hours ago',
    staff: 'Mike Smith', 
    staffAvatar: 'MS',
    staffRole: 'Plumbing Engineer',
    sla: '8h SLA',
    slaTime: '5h remaining',
    desc: 'Pressure drop observed in Block B residential riser. Secondary booster pump failing to kick in upon demand.',
    activity: [
      { time: '08:15 AM', user: 'Resident Portal', text: 'Ticket submitted via BMS portal.' },
      { time: '08:40 AM', user: 'Mike Smith', text: 'Dispatched to pump room. Replacing faulty pressure transducer sensor.' }
    ]
  },
  { 
    id: '1001', 
    subject: 'DG Set-1 Lubricant Oil Leak', 
    priority: 'High', 
    status: 'Open', 
    category: 'DG Set', 
    subItem: 'DG Set-1',
    asset: 'Caterpillar 1500kVA DG-1',
    location: 'Substation B1 • Gen-Room 2',
    date: '21 Apr 2026, 09:30 AM', 
    timeAgo: '2 hours ago',
    staff: 'John Doe', 
    staffAvatar: 'JD',
    staffRole: 'Lead DG Specialist',
    sla: '4h SLA (Urgent)',
    slaTime: '2h remaining',
    desc: 'Minor oil leak observed near primary oil filter housing during morning inspection. Secondary pressure drop detected.',
    activity: [
      { time: '09:30 AM', user: 'System Telemetry', text: 'Automated pressure fluctuation alarm triggered.' },
      { time: '09:45 AM', user: 'John Doe', text: 'Visual inspection confirmed seal hairline degradation near filter manifold.' }
    ]
  },
  { 
    id: '1000', 
    subject: 'Overhead Tank 2 High Level Sensor Float Switch Stuck', 
    priority: 'Medium', 
    status: 'Open', 
    category: 'Water Management', 
    subItem: 'AG TANK (Above Ground / OHT)',
    asset: 'OHT Tank #2 Ultrasonic Level Transmitter',
    location: 'Block A Rooftop • Water Tank Deck',
    date: '21 Apr 2026, 06:30 AM', 
    timeAgo: '5 hours ago',
    staff: 'Mike Smith', 
    staffAvatar: 'MS',
    staffRole: 'Plumbing Engineer',
    sla: '8h SLA',
    slaTime: '3h remaining',
    desc: 'OHT Tank 2 high alarm reporting overflow warning while physical level is at 78%. Mechanical float switch arm stuck with calcium build-up.',
    activity: [
      { time: '06:30 AM', user: 'Water Level Controller', text: 'Overflow cutoff trip triggered.' }
    ]
  }
];

const PRIORITY_CONFIG = {
  'Critical': { 
    color: '#f43f5e', 
    bg: 'rgba(244, 63, 94, 0.14)', 
    border: 'rgba(244, 63, 94, 0.4)',
    dot: '#f43f5e',
    glow: '0 0 10px rgba(244, 63, 94, 0.4)',
    pulse: true 
  },
  'High': { 
    color: '#fb923c', 
    bg: 'rgba(251, 146, 60, 0.14)', 
    border: 'rgba(251, 146, 60, 0.4)',
    dot: '#fb923c',
    glow: '0 0 8px rgba(251, 146, 60, 0.3)',
    pulse: false 
  },
  'Medium': { 
    color: '#fbbf24', 
    bg: 'rgba(251, 191, 36, 0.14)', 
    border: 'rgba(251, 191, 36, 0.4)',
    dot: '#fbbf24',
    glow: 'none',
    pulse: false 
  },
  'Low': { 
    color: '#34d399', 
    bg: 'rgba(52, 211, 153, 0.14)', 
    border: 'rgba(52, 211, 153, 0.4)',
    dot: '#34d399',
    glow: 'none',
    pulse: false 
  }
};

const STATUS_CONFIG = {
  'Open': { 
    color: '#38bdf8', 
    label: 'OPEN', 
    bg: 'rgba(56, 189, 248, 0.12)', 
    border: 'rgba(56, 189, 248, 0.35)',
    glow: '0 0 12px rgba(56, 189, 248, 0.25)'
  },
  'In Progress': { 
    color: '#a78bfa', 
    label: 'IN PROGRESS', 
    bg: 'rgba(167, 139, 250, 0.12)', 
    border: 'rgba(167, 139, 250, 0.35)',
    glow: '0 0 12px rgba(167, 139, 250, 0.25)'
  },
  'Closed': { 
    color: '#34d399', 
    label: 'RESOLVED', 
    bg: 'rgba(52, 211, 153, 0.12)', 
    border: 'rgba(52, 211, 153, 0.35)',
    glow: '0 0 12px rgba(52, 211, 153, 0.25)'
  }
};

const TicketingSystem = () => {
  // Persistence
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('bms_support_tickets_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
    return INITIAL_TICKETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bms_support_tickets_v5', JSON.stringify(tickets));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [tickets]);

  // Filtering & State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [facilityFilter, setFacilityFilter] = useState('ALL'); // 'ALL' or 'Energy Metering • Main Meter' or 'HVAC'
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'board'
  const [sortOrder, setSortOrder] = useState('newest');

  // Modals & Panels
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [newActivityNote, setNewActivityNote] = useState('');

  // Form State with Category and specific Sub-Item
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Energy Metering',
    subItem: 'Main Meter',
    priority: 'High',
    asset: 'Main Incomer HT Meter PM8000',
    location: 'Main Substation • Metering Room',
    staff: '',
    sla: '4h SLA (Urgent)',
    desc: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Stats
  const stats = useMemo(() => {
    const openCount = tickets.filter(t => t.status === 'Open').length;
    const progressCount = tickets.filter(t => t.status === 'In Progress').length;
    const closedCount = tickets.filter(t => t.status === 'Closed').length;
    const criticalCount = tickets.filter(t => (t.priority === 'Critical' || t.priority === 'High') && t.status !== 'Closed').length;

    return {
      total: tickets.length,
      open: openCount,
      inProgress: progressCount,
      closed: closedCount,
      critical: criticalCount
    };
  }, [tickets]);

  // Filtered List
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.asset && t.asset.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.location && t.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.staff && t.staff.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subItem && t.subItem.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' ? true : t.status === statusFilter;
      
      // Match Facility or specific sub-item filter
      let matchCat = true;
      if (facilityFilter !== 'ALL') {
        if (facilityFilter.includes(' • ')) {
          const [fName, sName] = facilityFilter.split(' • ');
          matchCat = t.category === fName && (t.subItem === sName || !t.subItem);
        } else {
          matchCat = t.category === facilityFilter;
        }
      }

      const matchPri = priorityFilter === 'ALL' ? true : t.priority === priorityFilter;

      return matchSearch && matchStatus && matchCat && matchPri;
    }).sort((a, b) => {
      if (sortOrder === 'priority') {
        const pMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }
      return parseInt(b.id) - parseInt(a.id);
    });
  }, [tickets, searchTerm, statusFilter, facilityFilter, priorityFilter, sortOrder]);

  // Handlers
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      subject: '',
      category: 'Energy Metering',
      subItem: 'Main Meter',
      priority: 'High',
      asset: 'Main Incomer HT Meter PM8000',
      location: 'Main Substation • Metering Room',
      staff: '',
      sla: '4h SLA (Urgent)',
      desc: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t, e) => {
    if (e) e.stopPropagation();
    setIsEditing(true);
    setFormData({ 
      ...t,
      subItem: t.subItem || (SIDEBAR_FACILITIES[t.category]?.subItems[0]?.name || '')
    });
    setShowModal(true);
  };

  const handleFacilityChange = (newCat) => {
    const config = SIDEBAR_FACILITIES[newCat];
    const defaultSub = config?.subItems?.[0]?.name || '';
    setFormData(prev => ({
      ...prev,
      category: newCat,
      subItem: defaultSub,
      asset: `${defaultSub} - Unit #1`
    }));
  };

  const handleSubItemChange = (newSub) => {
    setFormData(prev => ({
      ...prev,
      subItem: newSub,
      asset: prev.asset || `${newSub} - Node`
    }));
  };

  const handleSaveTicket = (e) => {
    e.preventDefault();
    if (isEditing) {
      setTickets(prev => prev.map(t => t.id === formData.id ? { ...formData } : t));
      if (activeTicket && activeTicket.id === formData.id) {
        setActiveTicket(formData);
      }
      showToast(`Incident #${formData.id} updated.`);
    } else {
      const nextId = (1001 + tickets.length + Math.floor(Math.random() * 8)).toString();
      const initials = formData.staff ? formData.staff.split(' ').map(n => n[0]).join('').toUpperCase() : 'BMS';
      const newTkt = {
        ...formData,
        id: nextId,
        status: 'Open',
        date: '21 Apr 2026, 12:30 PM',
        timeAgo: 'Just now',
        staffAvatar: initials,
        staffRole: 'Assigned Specialist',
        slaTime: 'SLA active',
        activity: [
          { time: 'Just now', user: 'Operations Center', text: `Incident logged for [${formData.category} ➜ ${formData.subItem}] and dispatched to ${formData.staff || 'Field Technician'}.` }
        ]
      };
      setTickets(prev => [newTkt, ...prev]);
      showToast(`Incident #${nextId} logged for ${formData.category} (${formData.subItem}).`);
    }
    setShowModal(false);
  };

  const handleDeleteTicket = (id, e) => {
    if (e) e.stopPropagation();
    setTickets(prev => prev.filter(t => t.id !== id));
    if (activeTicket && activeTicket.id === id) {
      setActiveTicket(null);
    }
    setDeleteConfirmId(null);
    showToast(`Ticket #${id} removed from manifest.`);
  };

  const handleUpdateStatus = (id, newStatus, e) => {
    if (e) e.stopPropagation();
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { 
          ...t, 
          status: newStatus,
          activity: [
            ...(t.activity || []),
            { time: 'Just now', user: 'Control Desk', text: `Status updated to ${newStatus.toUpperCase()}.` }
          ]
        };
        if (activeTicket && activeTicket.id === id) {
          setActiveTicket(updated);
        }
        return updated;
      }
      return t;
    }));
    showToast(`Ticket #${id} moved to ${newStatus}.`);
  };

  const handleAddActivityNote = (e) => {
    e.preventDefault();
    if (!newActivityNote.trim() || !activeTicket) return;

    const newLog = {
      time: 'Just now',
      user: 'Operations Lead',
      text: newActivityNote.trim()
    };

    const updated = {
      ...activeTicket,
      activity: [...(activeTicket.activity || []), newLog]
    };

    setTickets(prev => prev.map(t => t.id === activeTicket.id ? updated : t));
    setActiveTicket(updated);
    setNewActivityNote('');
    showToast('Diagnostic log recorded.');
  };

  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(`#${id}`);
    showToast(`Copied #${id} to clipboard.`);
  };

  const exportCSV = () => {
    const headers = ['Ticket ID', 'Subject', 'Facility', 'Sub-Item (Component)', 'Priority', 'Status', 'Asset', 'Location', 'Assignee', 'Date', 'Description'];
    const rows = filteredTickets.map(t => [
      `"${t.id}"`,
      `"${t.subject.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.subItem || ''}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${(t.asset || '').replace(/"/g, '""')}"`,
      `"${(t.location || '').replace(/"/g, '""')}"`,
      `"${(t.staff || '').replace(/"/g, '""')}"`,
      `"${t.date}"`,
      `"${(t.desc || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `bms_subfacility_manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported manifest as CSV.');
  };

  return (
    <div className="premium-ticketing-page">
      {/* LUXURY AMBIENT BACKGROUND GLOWS */}
      <div className="mesh-glow mesh-glow-1"></div>
      <div className="mesh-glow mesh-glow-2"></div>
      <div className="mesh-glow mesh-glow-3"></div>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="luxury-toast">
          <div className="toast-sparkle-ring">
            <Sparkles size={14} className="text-info" />
          </div>
          <span className="toast-text">{toastMessage}</span>
          <button className="toast-close" onClick={() => setToastMessage(null)}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* TOP COMMAND HEADER */}
      <div className="command-header mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
              <span className="status-live-chip">
                <span className="pulsing-beacon"></span>
                LIVE FACILITY PIPELINE
              </span>
              <span className="chip-separator">•</span>
              <span className="header-meta-tag">
                SMART OPERATIONS & SUB-SYSTEM INCIDENTS
              </span>
            </div>
            <h1 className="header-title mb-1">
              SUPPORT <span className="gradient-text">TICKETS</span>
            </h1>
            <p className="header-desc mb-0">
              Targeted incident logging for Energy Metering, DG Sets, Water Tanks, HVAC, Transformers & all Sub-systems.
            </p>
          </div>

          {/* TOP RIGHT TOOLBAR */}
          <div className="d-flex align-items-center gap-2.5 flex-wrap">
            <button 
              className="luxury-toolbar-btn" 
              onClick={() => {
                setTickets(INITIAL_TICKETS);
                showToast('Sidebar sub-system records refreshed.');
              }}
              title="Reset Sample Records"
            >
              <RefreshCw size={14} className="rotate-on-hover" />
              <span>Sync</span>
            </button>

            <button className="luxury-toolbar-btn" onClick={exportCSV} title="Export CSV Report">
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            {/* VIEW TOGGLE */}
            <div className="luxury-segmented-switch">
              <button 
                className={`switch-segment ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <FileText size={14} />
                <span>Table</span>
              </button>
              <button 
                className={`switch-segment ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid size={14} />
                <span>Board</span>
              </button>
            </div>

            {/* RAISE TICKET BUTTON */}
            <button className="luxury-primary-btn" onClick={handleOpenCreate}>
              <Plus size={16} strokeWidth={2.5} />
              <span>RAISE TICKET</span>
            </button>
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPI CARDS */}
      <Row className="g-3 mb-4">
        {/* TOTAL INCIDENTS */}
        <Col xs={12} sm={6} lg={3}>
          <div 
            className={`executive-kpi-card ${statusFilter === 'ALL' ? 'active-filter' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <div className="kpi-top-glow" style={{ background: 'linear-gradient(90deg, #64748b, #94a3b8)' }}></div>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="kpi-metric-title">TOTAL INCIDENTS</span>
                <div className="kpi-metric-number text-white">{stats.total}</div>
              </div>
              <div className="kpi-emblem" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                <Layers size={22} />
              </div>
            </div>
            <div className="kpi-footer-row">
              <span className="kpi-subtext">All sidebar sub-modules</span>
              <span className="kpi-action-link" style={{ color: '#94a3b8' }}>View All →</span>
            </div>
          </div>
        </Col>

        {/* OPEN & ACTIVE */}
        <Col xs={12} sm={6} lg={3}>
          <div 
            className={`executive-kpi-card ${statusFilter === 'Open' ? 'active-filter' : ''}`}
            onClick={() => setStatusFilter('Open')}
          >
            <div className="kpi-top-glow" style={{ background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }}></div>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="kpi-metric-title">OPEN & ACTIVE</span>
                <div className="kpi-metric-number" style={{ color: '#38bdf8' }}>{stats.open}</div>
              </div>
              <div className="kpi-emblem" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                <Clock size={22} />
              </div>
            </div>
            <div className="kpi-footer-row">
              <div className="d-flex align-items-center gap-1.5 text-warning fs-12 fw-semibold">
                <span className="mini-pulse-amber"></span>
                <span>Needs Attention</span>
              </div>
              <span className="kpi-action-link" style={{ color: '#38bdf8' }}>Filter Open →</span>
            </div>
          </div>
        </Col>

        {/* IN PROGRESS */}
        <Col xs={12} sm={6} lg={3}>
          <div 
            className={`executive-kpi-card ${statusFilter === 'In Progress' ? 'active-filter' : ''}`}
            onClick={() => setStatusFilter('In Progress')}
          >
            <div className="kpi-top-glow" style={{ background: 'linear-gradient(90deg, #6366f1, #a78bfa)' }}></div>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="kpi-metric-title">IN PROGRESS</span>
                <div className="kpi-metric-number" style={{ color: '#a78bfa' }}>{stats.inProgress}</div>
              </div>
              <div className="kpi-emblem" style={{ background: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.3)' }}>
                <Activity size={22} />
              </div>
            </div>
            <div className="kpi-footer-row">
              <span className="kpi-subtext">Technicians dispatched</span>
              <span className="kpi-action-link" style={{ color: '#a78bfa' }}>Filter Active →</span>
            </div>
          </div>
        </Col>

        {/* RESOLVED & CLOSED */}
        <Col xs={12} sm={6} lg={3}>
          <div 
            className={`executive-kpi-card ${statusFilter === 'Closed' ? 'active-filter' : ''}`}
            onClick={() => setStatusFilter('Closed')}
          >
            <div className="kpi-top-glow" style={{ background: 'linear-gradient(90deg, #059669, #34d399)' }}></div>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="kpi-metric-title">RESOLVED & CLOSED</span>
                <div className="kpi-metric-number" style={{ color: '#34d399' }}>{stats.closed}</div>
              </div>
              <div className="kpi-emblem" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                <CheckCircle2 size={22} />
              </div>
            </div>
            <div className="kpi-footer-row">
              <span className="kpi-subtext">96.4% on-time SLA</span>
              <span className="kpi-action-link" style={{ color: '#34d399' }}>Filter Closed →</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* FILTER & SEARCH COMMAND STRIP */}
      <div className="glass-control-panel mb-4 p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* SEARCH INPUT WITH KEYBOARD BADGE */}
          <div className="luxury-search-box flex-grow-1" style={{ maxWidth: 420 }}>
            <Search size={15} className="luxury-search-icon" />
            <input 
              type="text" 
              className="luxury-search-field"
              placeholder="Search by ID, equipment, sub-item, location or staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm ? (
              <button className="search-clear-pill" onClick={() => setSearchTerm('')}>
                <X size={13} />
              </button>
            ) : (
              <span className="kbd-shortcut-hint">Ctrl + K</span>
            )}
          </div>

          {/* STATUS PILL BUTTONS */}
          <div className="status-pill-group flex-wrap">
            {[
              { key: 'ALL', label: 'All', count: stats.total },
              { key: 'Open', label: 'Open', count: stats.open, color: '#38bdf8' },
              { key: 'In Progress', label: 'In Progress', count: stats.inProgress, color: '#a78bfa' },
              { key: 'Closed', label: 'Resolved', count: stats.closed, color: '#34d399' }
            ].map(tab => (
              <button 
                key={tab.key}
                className={`status-chip-btn ${statusFilter === tab.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="status-chip-count">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* DETAILED SUB-FACILITY SELECTOR DROPDOWN */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="select-wrapper" style={{ minWidth: 220 }}>
              <select 
                className="luxury-select-dropdown"
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
              >
                <option value="ALL">All Facilities & Sub-items</option>
                {Object.entries(SIDEBAR_FACILITIES).map(([facName, config]) => (
                  <optgroup key={facName} label={`--- ${facName.toUpperCase()} ---`}>
                    <option value={facName}>{facName} (All Sub-items)</option>
                    {config.subItems.map((sub, idx) => (
                      <option key={idx} value={`${facName} • ${sub.name}`}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={13} className="select-chevron" />
            </div>

            {/* PRIORITY FILTER */}
            <div className="select-wrapper">
              <select 
                className="luxury-select-dropdown"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                {Object.keys(PRIORITY_CONFIG).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown size={13} className="select-chevron" />
            </div>

            {/* SORT ORDER */}
            <div className="select-wrapper">
              <select 
                className="luxury-select-dropdown"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Sort: Newest</option>
                <option value="priority">Sort: Severity</option>
              </select>
              <ChevronDown size={13} className="select-chevron" />
            </div>

            {/* CLEAR FILTER BUTTON */}
            {(searchTerm || statusFilter !== 'ALL' || facilityFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <button 
                className="luxury-clear-btn"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setFacilityFilter('ALL');
                  setPriorityFilter('ALL');
                }}
              >
                <RotateCcw size={12} className="me-1" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="glass-manifest-card">
          <div className="manifest-header-bar px-4 py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2.5">
              <span className="manifest-heading">INCIDENT MANIFEST</span>
              <span className="record-count-badge">{filteredTickets.length} records</span>
            </div>
            <div className="manifest-hint">
              Click any row to open incident diagnostics & history
            </div>
          </div>

          <div className="table-responsive">
            <Table hover variant="dark" className="luxury-data-table mb-0 align-middle">
              <thead>
                <tr>
                  <th className="th-style ps-4">TICKET ID</th>
                  <th className="th-style" style={{ minWidth: 290 }}>EQUIPMENT & INCIDENT DETAILS</th>
                  <th className="th-style" style={{ minWidth: 210 }}>FACILITY & SUB-ITEM</th>
                  <th className="th-style">PRIORITY</th>
                  <th className="th-style" style={{ minWidth: 170 }}>ASSIGNED TECH</th>
                  <th className="th-style">STATUS</th>
                  <th className="th-style pe-4 text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="empty-results-box">
                        <AlertCircle size={44} className="text-secondary opacity-30 mb-3" />
                        <h6 className="text-white fw-bold mb-1">No Matching Incidents Found</h6>
                        <p className="text-secondary fs-12 mb-3">
                          No incidents found for the selected sub-item or keyword. Reset filters to see all tickets.
                        </p>
                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          className="px-3 py-1 fs-12 rounded-3"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                            setFacilityFilter('ALL');
                            setPriorityFilter('ALL');
                          }}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => {
                    const CatConfig = SIDEBAR_FACILITIES[t.category] || SIDEBAR_FACILITIES['Maintenance'];
                    const CatIcon = CatConfig.icon;
                    const PriConfig = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG['Medium'];
                    const StatConfig = STATUS_CONFIG[t.status] || STATUS_CONFIG['Open'];

                    return (
                      <tr 
                        key={t.id} 
                        className="luxury-table-row"
                        onClick={() => setActiveTicket(t)}
                      >
                        {/* TICKET ID */}
                        <td className="ps-4 py-3.5">
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="mono-ticket-tag">#{t.id}</span>
                            <button 
                              className="id-copy-icon" 
                              onClick={(e) => handleCopyId(t.id, e)} 
                              title="Copy Ticket ID"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </td>

                        {/* EQUIPMENT & INCIDENT DETAILS */}
                        <td className="py-3.5">
                          <div className="incident-content-cell">
                            <div className="incident-title-text mb-1">
                              {t.subject}
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              {t.asset && (
                                <span className="refined-asset-chip">
                                  <Building size={11} className="chip-icon opacity-80" />
                                  <span>{t.asset}</span>
                                </span>
                              )}
                              {t.location && (
                                <span className="refined-location-chip">
                                  <MapPin size={11} className="chip-icon opacity-80" />
                                  <span>{t.location}</span>
                                </span>
                              )}
                              <span className="incident-timestamp">
                                <Clock size={11} className="me-1 opacity-70" />
                                {t.date}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* FACILITY & SPECIFIC SUB-ITEM (KIS PE COMPLAIN HAI) */}
                        <td className="py-3.5">
                          <div className="d-flex flex-column align-items-start gap-1">
                            <span 
                              className="refined-category-badge"
                              style={{ 
                                color: CatConfig.color, 
                                background: CatConfig.bg, 
                                borderColor: CatConfig.border,
                                boxShadow: `0 2px 8px ${CatConfig.glow}`
                              }}
                            >
                              <CatIcon size={12} className="me-1.5" />
                              {t.category}
                            </span>
                            {t.subItem && (
                              <span className="sub-item-badge">
                                <CornerDownRight size={11} className="me-1 text-info opacity-80" />
                                <span className="text-white fw-bold">{t.subItem}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* PRIORITY BADGE */}
                        <td className="py-3.5">
                          <span 
                            className="refined-priority-badge"
                            style={{ 
                              color: PriConfig.color, 
                              background: PriConfig.bg, 
                              borderColor: PriConfig.border 
                            }}
                          >
                            <span 
                              className={`priority-beacon-dot ${PriConfig.pulse ? 'pulsing' : ''}`}
                              style={{ 
                                background: PriConfig.dot,
                                boxShadow: PriConfig.glow
                              }}
                            ></span>
                            {t.priority}
                          </span>
                        </td>

                        {/* ASSIGNED TECHNICIAN */}
                        <td className="py-3.5">
                          <div className="d-flex align-items-center gap-2.5">
                            <div className="tech-avatar-gradient">
                              {t.staffAvatar || (t.staff ? t.staff.slice(0, 2).toUpperCase() : 'BMS')}
                            </div>
                            <div className="tech-info-column">
                              <span className="tech-name-text">
                                {t.staff || 'Unassigned'}
                              </span>
                              <span className="tech-role-text">
                                {t.staffRole || 'Field Specialist'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* STATUS CAPSULE */}
                        <td className="py-3.5">
                          <div 
                            className="refined-status-capsule"
                            style={{
                              color: StatConfig.color,
                              background: StatConfig.bg,
                              borderColor: StatConfig.border,
                              boxShadow: StatConfig.glow
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = t.status === 'Open' ? 'In Progress' : t.status === 'In Progress' ? 'Closed' : 'Open';
                              handleUpdateStatus(t.id, next, e);
                            }}
                            title="Click to advance status"
                          >
                            <span className="capsule-dot" style={{ background: StatConfig.color }}></span>
                            <span>{StatConfig.label}</span>
                          </div>
                        </td>

                        {/* ACTION CONTROLS */}
                        <td className="pe-4 py-3.5 text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex justify-content-end gap-1.5 align-items-center">
                            {/* INSPECT */}
                            <button 
                              className="luxury-action-btn view-btn" 
                              onClick={() => setActiveTicket(t)} 
                              title="Inspect Diagnostics & History"
                            >
                              <Eye size={14} />
                            </button>

                            {/* QUICK RESOLVE / TOGGLE */}
                            <button 
                              className={`luxury-action-btn ${t.status === 'Closed' ? 'resolved-active' : 'resolve-btn'}`}
                              onClick={(e) => handleUpdateStatus(t.id, t.status === 'Closed' ? 'Open' : 'Closed', e)}
                              title={t.status === 'Closed' ? 'Reopen Incident' : 'Mark as Resolved'}
                            >
                              <CheckCircle size={14} />
                            </button>

                            {/* EDIT */}
                            <button 
                              className="luxury-action-btn edit-btn" 
                              onClick={(e) => handleOpenEdit(t, e)}
                              title="Edit Incident"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* DELETE */}
                            <button 
                              className="luxury-action-btn delete-btn" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(t.id);
                              }}
                              title="Delete Incident"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="kanban-pipeline-view">
          <Row className="g-3">
            {[
              { key: 'Open', title: 'OPEN & REPORTED', color: '#38bdf8', icon: Clock },
              { key: 'In Progress', title: 'IN PROGRESS / DISPATCHED', color: '#a78bfa', icon: Activity },
              { key: 'Closed', title: 'RESOLVED & VERIFIED', color: '#34d399', icon: CheckCircle }
            ].map(col => {
              const colTickets = filteredTickets.filter(t => t.status === col.key);
              const ColIcon = col.icon;

              return (
                <Col md={4} key={col.key}>
                  <div className="kanban-column-card">
                    <div className="kanban-header-bar" style={{ borderTop: `3px solid ${col.color}` }}>
                      <div className="d-flex align-items-center gap-2">
                        <ColIcon size={15} style={{ color: col.color }} />
                        <span className="kanban-col-label">{col.title}</span>
                      </div>
                      <span className="kanban-count-tag" style={{ color: col.color, background: `${col.color}18` }}>
                        {colTickets.length}
                      </span>
                    </div>

                    <div className="kanban-scroll-area">
                      {colTickets.length === 0 ? (
                        <div className="kanban-empty-zone">
                          <span className="fs-12 text-secondary opacity-50">No incidents in this pipeline</span>
                        </div>
                      ) : (
                        colTickets.map(t => {
                          const CatConfig = SIDEBAR_FACILITIES[t.category] || SIDEBAR_FACILITIES['Maintenance'];
                          const CatIcon = CatConfig.icon;
                          const PriConfig = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG['Medium'];

                          return (
                            <div 
                              key={t.id} 
                              className="kanban-incident-card"
                              onClick={() => setActiveTicket(t)}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="mono-ticket-tag">#{t.id}</span>
                                <span 
                                  className="refined-priority-badge"
                                  style={{ 
                                    color: PriConfig.color, 
                                    background: PriConfig.bg, 
                                    borderColor: PriConfig.border 
                                  }}
                                >
                                  {t.priority}
                                </span>
                              </div>

                              <div className="kanban-card-title mb-1.5">{t.subject}</div>
                              <div className="kanban-card-desc mb-2.5">{t.desc}</div>

                              <div className="d-flex align-items-center gap-1.5 mb-3 flex-wrap">
                                <span 
                                  className="refined-category-badge"
                                  style={{ 
                                    color: CatConfig.color, 
                                    background: CatConfig.bg, 
                                    borderColor: CatConfig.border,
                                    fontSize: '0.68rem',
                                    padding: '2px 8px'
                                  }}
                                >
                                  <CatIcon size={11} className="me-1" />
                                  {t.category}
                                </span>
                                {t.subItem && (
                                  <span className="sub-item-badge" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                                    ↳ {t.subItem}
                                  </span>
                                )}
                              </div>

                              <div className="d-flex justify-content-between align-items-center pt-2 border-top border-white border-opacity-5">
                                <div className="d-flex align-items-center gap-2">
                                  <div className="tech-avatar-gradient" style={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                                    {t.staffAvatar || (t.staff ? t.staff.slice(0, 2).toUpperCase() : 'BMS')}
                                  </div>
                                  <span className="fs-11 text-secondary">{t.staff || 'Unassigned'}</span>
                                </div>

                                <div className="d-flex gap-1" onClick={e => e.stopPropagation()}>
                                  {col.key === 'Open' && (
                                    <button 
                                      className="kanban-quick-action" 
                                      onClick={(e) => handleUpdateStatus(t.id, 'In Progress', e)}
                                    >
                                      Start →
                                    </button>
                                  )}
                                  {col.key === 'In Progress' && (
                                    <button 
                                      className="kanban-quick-action success" 
                                      onClick={(e) => handleUpdateStatus(t.id, 'Closed', e)}
                                    >
                                      Resolve ✓
                                    </button>
                                  )}
                                  {col.key === 'Closed' && (
                                    <button 
                                      className="kanban-quick-action" 
                                      onClick={(e) => handleUpdateStatus(t.id, 'Open', e)}
                                    >
                                      Reopen ⟲
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      )}

      {/* INSPECTION / DETAILS SLIDE DRAWER */}
      {activeTicket && (
        <div className="slide-drawer-backdrop" onClick={() => setActiveTicket(null)}>
          <div className="slide-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head p-4 border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-start">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                  <span className="mono-ticket-tag fs-13">#{activeTicket.id}</span>
                  <span 
                    className="refined-status-capsule"
                    style={{
                      color: STATUS_CONFIG[activeTicket.status]?.color,
                      background: STATUS_CONFIG[activeTicket.status]?.bg,
                      borderColor: STATUS_CONFIG[activeTicket.status]?.border
                    }}
                  >
                    {STATUS_CONFIG[activeTicket.status]?.label}
                  </span>
                  <span 
                    className="refined-priority-badge"
                    style={{
                      color: PRIORITY_CONFIG[activeTicket.priority]?.color,
                      background: PRIORITY_CONFIG[activeTicket.priority]?.bg,
                      borderColor: PRIORITY_CONFIG[activeTicket.priority]?.border
                    }}
                  >
                    {activeTicket.priority} Priority
                  </span>
                </div>
                <h4 className="text-white fw-bold mb-1 fs-18">{activeTicket.subject}</h4>
                <div className="text-secondary fs-12">
                  Created: {activeTicket.date} ({activeTicket.timeAgo || 'Recent'}) • Target SLA: <span className="text-info">{activeTicket.sla || 'Standard'}</span>
                </div>
              </div>
              <button className="drawer-x-btn" onClick={() => setActiveTicket(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-content-body p-4 custom-scrollbar">
              {/* ASSET & SUB-ITEM SPECIFICATION GRID */}
              <div className="drawer-spec-grid mb-4">
                <div className="spec-card">
                  <span className="spec-label">FACILITY (SIDEBAR)</span>
                  <span className="spec-val text-info">{activeTicket.category}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">SUB-ITEM COMPONENT</span>
                  <span className="spec-val text-warning">{activeTicket.subItem || 'General Unit'}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">EQUIPMENT / ASSET TAG</span>
                  <span className="spec-val text-white">{activeTicket.asset || 'Central Facility Node'}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">ZONE & LOCATION</span>
                  <span className="spec-val text-white">{activeTicket.location || 'Building Perimeter'}</span>
                </div>
              </div>

              {/* INCIDENT SYNOPSIS */}
              <div className="mb-4">
                <span className="drawer-subheading">INCIDENT SYNOPSIS & OBSERVATIONS</span>
                <div className="synopsis-box">
                  {activeTicket.desc}
                </div>
              </div>

              {/* TIMELINE / AUDIT TRAIL */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="drawer-subheading mb-0">AUDIT TRAIL & LOGS</span>
                  <span className="audit-event-count">{(activeTicket.activity || []).length} events</span>
                </div>
                <div className="audit-timeline">
                  {(activeTicket.activity || []).map((act, index) => (
                    <div key={index} className="timeline-node">
                      <div className="node-marker"></div>
                      <div className="node-card">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="node-author">{act.user}</span>
                          <span className="node-time">{act.time}</span>
                        </div>
                        <p className="node-text mb-0">{act.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADD NOTE / COMMENT */}
              <div className="mb-4">
                <span className="drawer-subheading">RECORD DIAGNOSTIC NOTE</span>
                <form onSubmit={handleAddActivityNote} className="d-flex gap-2">
                  <input 
                    type="text"
                    className="drawer-note-input flex-grow-1"
                    placeholder="Type diagnostic update or maintenance note..."
                    value={newActivityNote}
                    onChange={(e) => setNewActivityNote(e.target.value)}
                  />
                  <button type="submit" className="luxury-primary-btn px-3" disabled={!newActivityNote.trim()}>
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>

            {/* DRAWER FOOTER */}
            <div className="drawer-bottom-bar p-4 border-top border-white border-opacity-10 d-flex justify-content-between align-items-center gap-2">
              <div className="d-flex gap-2">
                {activeTicket.status !== 'In Progress' && activeTicket.status !== 'Closed' && (
                  <button 
                    className="luxury-toolbar-btn" 
                    onClick={() => handleUpdateStatus(activeTicket.id, 'In Progress')}
                  >
                    <Activity size={14} className="me-1 text-info" />
                    Dispatch / Work
                  </button>
                )}
                {activeTicket.status !== 'Closed' ? (
                  <button 
                    className="luxury-success-btn" 
                    onClick={() => handleUpdateStatus(activeTicket.id, 'Closed')}
                  >
                    <CheckCircle size={14} className="me-1" />
                    Mark Resolved
                  </button>
                ) : (
                  <button 
                    className="luxury-toolbar-btn" 
                    onClick={() => handleUpdateStatus(activeTicket.id, 'Open')}
                  >
                    <RotateCcw size={14} className="me-1" />
                    Reopen Incident
                  </button>
                )}
              </div>

              <div className="d-flex gap-2">
                <button 
                  className="luxury-toolbar-btn"
                  onClick={() => handleOpenEdit(activeTicket)}
                >
                  <Edit3 size={14} className="me-1" />
                  Edit
                </button>
                <button 
                  className="luxury-secondary-btn" 
                  onClick={() => setActiveTicket(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL WITH CASCADING SUB-ITEMS */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        centered 
        size="lg" 
        className="luxury-bms-modal"
      >
        <Modal.Body className="p-0 rounded-4 overflow-hidden modal-body-shell">
          <div className="modal-title-bar p-4 border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div className="modal-lead-icon">
                <Ticket size={22} className="text-info" />
              </div>
              <div>
                <h5 className="modal-title-heading mb-0">
                  {isEditing ? 'UPDATE INCIDENT RECORD' : 'RAISE FACILITY TICKET'}
                </h5>
                <span className="fs-12 text-secondary opacity-60">
                  Select Facility & exact Sub-System component to register complaint
                </span>
              </div>
            </div>
            <button className="drawer-x-btn" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveTicket} className="p-4">
            <Row className="g-3 mb-3">
              {/* PRIMARY FACILITY SELECTOR */}
              <Col xs={12} sm={6}>
                <label className="luxury-form-label d-flex justify-content-between">
                  <span>1. FACILITY (SIDEBAR CATEGORY) *</span>
                  <span className="text-info fs-11">Primary Module</span>
                </label>
                <div className="select-wrapper">
                  <select 
                    className="luxury-form-input"
                    value={formData.category}
                    onChange={(e) => handleFacilityChange(e.target.value)}
                  >
                    {Object.keys(SIDEBAR_FACILITIES).map(facName => (
                      <option key={facName} value={facName}>
                        {facName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="select-chevron" />
                </div>
              </Col>

              {/* SPECIFIC SUB-ITEM SELECTOR (KIS PE COMPLAIN KARNA HAI) */}
              <Col xs={12} sm={6}>
                <label className="luxury-form-label d-flex justify-content-between">
                  <span className="text-warning">2. SUB-ITEM (KIS PE COMPLAIN HAI?) *</span>
                  <span className="text-secondary fs-11">Specific Section</span>
                </label>
                <div className="select-wrapper">
                  <select 
                    className="luxury-form-input"
                    value={formData.subItem}
                    onChange={(e) => handleSubItemChange(e.target.value)}
                    style={{ borderColor: 'rgba(251, 191, 36, 0.4)' }}
                  >
                    {SIDEBAR_FACILITIES[formData.category]?.subItems.map((sub, idx) => (
                      <option key={idx} value={sub.name}>
                        ↳ {sub.name} — ({sub.desc})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="select-chevron text-warning" />
                </div>
              </Col>

              {/* QUICK CLICKABLE SUB-ITEM CHIPS */}
              <Col xs={12}>
                <div className="subitem-chips-panel">
                  <div className="d-flex align-items-center gap-1.5 mb-1.5">
                    <Sparkles size={12} className="text-info" />
                    <span className="fs-11 text-secondary fw-bold">
                      Click to quickly target sub-item in {formData.category}:
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-1.5">
                    {SIDEBAR_FACILITIES[formData.category]?.subItems.map((sub, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`subitem-chip-btn ${formData.subItem === sub.name ? 'active' : ''}`}
                        onClick={() => handleSubItemChange(sub.name)}
                      >
                        <span className="chip-bullet">•</span>
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              </Col>

              {/* INCIDENT TITLE */}
              <Col xs={12}>
                <label className="luxury-form-label">INCIDENT SUBJECT / SUMMARY *</label>
                <input 
                  type="text" 
                  className="luxury-form-input" 
                  required 
                  placeholder={`e.g. ${formData.category} - ${formData.subItem} malfunction / parameter out of range`}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </Col>

              {/* PRIORITY SEVERITY */}
              <Col xs={12} sm={6}>
                <label className="luxury-form-label">PRIORITY SEVERITY *</label>
                <div className="select-wrapper">
                  <select 
                    className="luxury-form-input"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Critical">Critical (Immediate Hazard / Outage)</option>
                    <option value="High">High (Major Operational Impairment)</option>
                    <option value="Medium">Medium (Standard Maintenance)</option>
                    <option value="Low">Low (Routine / Advisory)</option>
                  </select>
                  <ChevronDown size={14} className="select-chevron" />
                </div>
              </Col>

              {/* ASSET NAME */}
              <Col xs={12} sm={6}>
                <label className="luxury-form-label">EQUIPMENT / ASSET TAG *</label>
                <input 
                  type="text" 
                  className="luxury-form-input" 
                  required
                  placeholder="e.g. Unit #1 (Model / Serial No.)"
                  value={formData.asset}
                  onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                />
              </Col>

              {/* LOCATION */}
              <Col xs={12} sm={6}>
                <label className="luxury-form-label">BUILDING ZONE / LOCATION</label>
                <input 
                  type="text" 
                  className="luxury-form-input" 
                  placeholder="e.g. Substation B1 / Rooftop Tank Deck / Floor 3"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Col>

              {/* ASSIGNED TECHNICIAN */}
              <Col xs={12} sm={6}>
                <label className="luxury-form-label">DISPATCH TO TECHNICIAN / CREW</label>
                <input 
                  type="text" 
                  className="luxury-form-input" 
                  placeholder="e.g. Mike Smith (Duty Specialist)"
                  value={formData.staff}
                  onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                />
              </Col>

              {/* SLA TARGET */}
              <Col xs={12} sm={6}>
                <label className="luxury-form-label">EXPECTED RESOLUTION SLA</label>
                <div className="select-wrapper">
                  <select 
                    className="luxury-form-input"
                    value={formData.sla}
                    onChange={(e) => setFormData({ ...formData, sla: e.target.value })}
                  >
                    <option value="2h SLA (Emergency)">2 Hours (Emergency SLA)</option>
                    <option value="4h SLA (Urgent)">4 Hours (Urgent SLA)</option>
                    <option value="8h SLA">8 Hours (Standard Service)</option>
                    <option value="24h SLA">24 Hours (Next Day Queue)</option>
                    <option value="48h SLA">48 Hours (Routine Inspection)</option>
                  </select>
                  <ChevronDown size={14} className="select-chevron" />
                </div>
              </Col>

              {/* INCIDENT DESCRIPTION */}
              <Col xs={12}>
                <label className="luxury-form-label">DETAILED INCIDENT DESCRIPTION *</label>
                <textarea 
                  rows={3}
                  className="luxury-form-input"
                  required
                  placeholder={`Describe what went wrong with ${formData.subItem}, sensor readings, physical alarms or symptoms observed...`}
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                />
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2.5 pt-3 border-top border-white border-opacity-10">
              <button 
                type="button" 
                className="luxury-toolbar-btn px-4"
                onClick={() => setShowModal(false)}
              >
                Abort
              </button>
              <button 
                type="submit" 
                className="luxury-primary-btn px-4"
              >
                {isEditing ? 'SAVE UPDATES' : 'DISPATCH INCIDENT'}
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal 
        show={Boolean(deleteConfirmId)} 
        onHide={() => setDeleteConfirmId(null)}
        centered
        size="sm"
        className="luxury-bms-modal"
      >
        <Modal.Body className="p-4 rounded-4 modal-body-shell text-center">
          <div className="delete-alert-icon mb-3">
            <AlertTriangle size={30} className="text-danger" />
          </div>
          <h5 className="text-white fw-bold mb-2 fs-16">Delete Incident Record?</h5>
          <p className="text-secondary fs-12 mb-4">
            Are you sure you want to permanently delete ticket <span className="text-white fw-bold">#{deleteConfirmId}</span>? This action cannot be reversed.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button 
              className="luxury-toolbar-btn px-3" 
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </button>
            <button 
              className="luxury-danger-btn px-3" 
              onClick={(e) => handleDeleteTicket(deleteConfirmId, e)}
            >
              Confirm Delete
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* REFINED ENTERPRISE STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* PAGE BASE */
        .premium-ticketing-page {
          position: relative;
          min-height: 100vh;
          background: #060913;
          background-image: 
            radial-gradient(at 10% 15%, rgba(56, 189, 248, 0.05) 0px, transparent 50%),
            radial-gradient(at 90% 85%, rgba(129, 140, 248, 0.05) 0px, transparent 50%);
          color: #f1f5f9;
          padding: 1.5rem 1.85rem 3rem 1.85rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          overflow-x: hidden;
        }

        /* AMBIENT MESH GLOWS */
        .mesh-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(140px);
          opacity: 0.12;
        }
        .mesh-glow-1 {
          top: -100px;
          right: 10%;
          width: 550px;
          height: 450px;
          background: #38bdf8;
        }
        .mesh-glow-2 {
          top: 320px;
          left: -80px;
          width: 480px;
          height: 480px;
          background: #818cf8;
        }
        .mesh-glow-3 {
          bottom: 100px;
          right: 5%;
          width: 400px;
          height: 400px;
          background: #10b981;
          opacity: 0.08;
        }

        /* HEADER */
        .command-header {
          position: relative;
          z-index: 1;
        }
        .status-live-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.28);
          color: #38bdf8;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.07em;
        }
        .pulsing-beacon {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
          animation: beaconPulse 1.8s infinite;
        }
        @keyframes beaconPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.35); }
        }
        .chip-separator {
          color: #475569;
          font-size: 0.75rem;
        }
        .header-meta-tag {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.06em;
        }
        .header-title {
          font-size: 2.15rem;
          font-weight: 850;
          letter-spacing: -0.03em;
          color: #ffffff;
        }
        .gradient-text {
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .header-desc {
          font-size: 0.84rem;
          color: #94a3b8;
          font-weight: 450;
          max-width: 650px;
        }

        /* BUTTONS */
        .luxury-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
          color: #041226;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 18px rgba(56, 189, 248, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .luxury-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(56, 189, 248, 0.45);
          color: #000;
        }
        .luxury-toolbar-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.74rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.04);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .luxury-toolbar-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.16);
        }
        .luxury-success-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.74rem;
          font-weight: 700;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: #ffffff;
          border: none;
          cursor: pointer;
        }
        .luxury-success-btn:hover { filter: brightness(1.1); }
        .luxury-secondary-btn {
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.74rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          border: none;
          cursor: pointer;
        }
        .luxury-secondary-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
        .luxury-danger-btn {
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.74rem;
          font-weight: 700;
          background: #ef4444;
          color: #fff;
          border: none;
          cursor: pointer;
        }

        .rotate-on-hover:hover {
          transform: rotate(180deg);
          transition: transform 0.4s ease;
        }

        /* SEGMENTED SWITCH */
        .luxury-segmented-switch {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          padding: 3px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .switch-segment {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 0.74rem;
          font-weight: 700;
          color: #94a3b8;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .switch-segment.active {
          background: rgba(56, 189, 248, 0.16);
          color: #38bdf8;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }

        /* EXECUTIVE KPI CARDS */
        .executive-kpi-card {
          position: relative;
          background: linear-gradient(180deg, rgba(17, 24, 39, 0.7) 0%, rgba(11, 16, 28, 0.85) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.25rem 1.4rem;
          backdrop-filter: blur(20px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 24px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .executive-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.3);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 14px 32px rgba(0, 0, 0, 0.5);
        }
        .executive-kpi-card.active-filter {
          border-color: rgba(56, 189, 248, 0.55);
          box-shadow: inset 0 1px 0 rgba(56, 189, 248, 0.3), 0 0 25px rgba(56, 189, 248, 0.18);
          background: linear-gradient(180deg, rgba(20, 32, 54, 0.85) 0%, rgba(13, 20, 36, 0.95) 100%);
        }
        .kpi-top-glow {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }
        .kpi-metric-title {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.09em;
          color: #94a3b8;
          text-transform: uppercase;
          display: block;
        }
        .kpi-metric-number {
          font-size: 2.2rem;
          font-weight: 850;
          line-height: 1.1;
          margin-top: 4px;
        }
        .kpi-emblem {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
        }
        .kpi-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .kpi-subtext {
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .kpi-action-link {
          font-size: 0.72rem;
          font-weight: 750;
        }
        .mini-pulse-amber {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 6px #f59e0b;
          animation: beaconPulse 1.4s infinite;
        }

        /* CONTROL PANEL STRIP */
        .glass-control-panel {
          position: relative;
          z-index: 1;
          background: linear-gradient(180deg, rgba(17, 24, 39, 0.7) 0%, rgba(11, 16, 28, 0.8) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          backdrop-filter: blur(20px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }
        .luxury-search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .luxury-search-icon {
          position: absolute;
          left: 12px;
          color: #64748b;
          pointer-events: none;
        }
        .luxury-search-field {
          width: 100%;
          height: 38px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0 64px 0 36px;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }
        .luxury-search-field:focus {
          border-color: #38bdf8;
          background: rgba(15, 23, 42, 0.85);
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.2);
        }
        .kbd-shortcut-hint {
          position: absolute;
          right: 10px;
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          pointer-events: none;
        }
        .search-clear-pill {
          position: absolute;
          right: 10px;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
        }
        .search-clear-pill:hover { color: #fff; }

        /* STATUS PILLS */
        .status-pill-group {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 0, 0, 0.25);
          padding: 3px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .status-chip-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 0.74rem;
          font-weight: 700;
          color: #94a3b8;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .status-chip-btn.active {
          background: rgba(56, 189, 248, 0.16);
          color: #38bdf8;
        }
        .status-chip-count {
          padding: 1px 6px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 750;
          background: rgba(255, 255, 255, 0.08);
        }
        .status-chip-btn.active .status-chip-count {
          background: rgba(56, 189, 248, 0.25);
          color: #38bdf8;
        }

        /* SELECT DROPDOWNS */
        .select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .luxury-select-dropdown {
          width: 100%;
          height: 38px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0 28px 0 12px;
          color: #cbd5e1;
          font-size: 0.74rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }
        .luxury-select-dropdown:focus { border-color: #38bdf8; }
        .luxury-select-dropdown optgroup { background: #0f172a; color: #38bdf8; font-weight: 800; }
        .luxury-select-dropdown option { background: #0b1120; color: #fff; font-weight: 500; }
        .select-chevron {
          position: absolute;
          right: 10px;
          color: #64748b;
          pointer-events: none;
        }
        .luxury-clear-btn {
          display: flex;
          align-items: center;
          height: 38px;
          padding: 0 12px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.22);
          color: #f87171;
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
        }
        .luxury-clear-btn:hover { background: rgba(239, 68, 68, 0.18); }

        /* MANIFEST CARD & TABLE */
        .glass-manifest-card {
          position: relative;
          z-index: 1;
          background: linear-gradient(180deg, rgba(17, 24, 39, 0.75) 0%, rgba(10, 15, 26, 0.88) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 16px 45px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        .manifest-header-bar {
          background: rgba(0, 0, 0, 0.28);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .manifest-heading {
          font-size: 0.78rem;
          font-weight: 850;
          letter-spacing: 0.09em;
          color: #e2e8f0;
          text-transform: uppercase;
        }
        .record-count-badge {
          padding: 2px 8px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38bdf8;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .manifest-hint {
          font-size: 0.74rem;
          color: #64748b;
          font-weight: 500;
        }

        .luxury-data-table {
          --bs-table-bg: transparent !important;
          border-collapse: separate;
          border-spacing: 0;
        }
        .th-style {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #64748b;
          text-transform: uppercase;
          padding-top: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
          background: rgba(0, 0, 0, 0.25) !important;
        }
        .luxury-table-row {
          transition: all 0.18s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
          cursor: pointer;
        }
        .luxury-table-row:hover {
          background: rgba(56, 189, 248, 0.04) !important;
        }

        /* CELLS */
        .mono-ticket-tag {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.76rem;
          font-weight: 800;
          color: #38bdf8;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.22);
        }
        .id-copy-icon {
          opacity: 0.35;
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 2px;
          border-radius: 4px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .luxury-table-row:hover .id-copy-icon { opacity: 0.9; }
        .id-copy-icon:hover { color: #38bdf8; }

        .incident-content-cell {
          display: flex;
          flex-direction: column;
        }
        .incident-title-text {
          font-size: 0.88rem;
          font-weight: 750;
          color: #ffffff;
          line-height: 1.3;
        }
        .refined-asset-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          font-size: 0.74rem;
          font-weight: 600;
        }
        .refined-location-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(56, 189, 248, 0.05);
          border: 1px solid rgba(56, 189, 248, 0.12);
          color: #94a3b8;
          font-size: 0.74rem;
          font-weight: 500;
        }
        .incident-timestamp {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 500;
        }

        /* BADGES */
        .refined-category-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 7px;
          font-size: 0.71rem;
          font-weight: 750;
          border: 1px solid transparent;
        }
        .sub-item-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 0.71rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .refined-priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 800;
          border: 1px solid transparent;
        }
        .priority-beacon-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .priority-beacon-dot.pulsing {
          animation: beaconPulse 1.2s infinite;
        }

        /* TECH AVATAR & INFO */
        .tech-avatar-gradient {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38bdf8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 850;
          flex-shrink: 0;
        }
        .tech-info-column {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .tech-name-text {
          font-size: 0.78rem;
          font-weight: 750;
          color: #ffffff;
          white-space: nowrap;
        }
        .tech-role-text {
          font-size: 0.68rem;
          color: #64748b;
          white-space: nowrap;
        }

        /* STATUS CAPSULE */
        .refined-status-capsule {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 13px;
          border-radius: 9999px;
          font-size: 0.69rem;
          font-weight: 850;
          letter-spacing: 0.06em;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .refined-status-capsule:hover {
          transform: scale(1.04);
        }
        .capsule-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* ACTION BUTTONS */
        .luxury-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.03);
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .luxury-action-btn:hover {
          transform: translateY(-2px);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.16);
        }
        .luxury-action-btn.view-btn:hover {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.35);
        }
        .luxury-action-btn.resolve-btn:hover {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.35);
        }
        .luxury-action-btn.resolved-active {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border-color: #10b981;
        }
        .luxury-action-btn.edit-btn:hover {
          background: rgba(167, 139, 250, 0.15);
          color: #a78bfa;
          border-color: rgba(167, 139, 250, 0.35);
        }
        .luxury-action-btn.delete-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.35);
        }

        /* KANBAN BOARD */
        .kanban-pipeline-view {
          position: relative;
          z-index: 1;
        }
        .kanban-column-card {
          background: linear-gradient(180deg, rgba(17, 24, 39, 0.7) 0%, rgba(10, 15, 26, 0.85) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          overflow: hidden;
          min-height: 480px;
        }
        .kanban-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .kanban-col-label {
          font-size: 0.74rem;
          font-weight: 850;
          letter-spacing: 0.08em;
          color: #e2e8f0;
        }
        .kanban-count-tag {
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .kanban-scroll-area {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .kanban-incident-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .kanban-incident-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.35);
          background: rgba(56, 189, 248, 0.03);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
        }
        .kanban-card-title {
          font-size: 0.86rem;
          font-weight: 750;
          color: #fff;
          line-height: 1.3;
        }
        .kanban-card-desc {
          font-size: 0.74rem;
          color: #94a3b8;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        .kanban-quick-action {
          padding: 2px 8px;
          border-radius: 5px;
          font-size: 0.68rem;
          font-weight: 750;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38bdf8;
          cursor: pointer;
        }
        .kanban-quick-action:hover { background: rgba(56, 189, 248, 0.2); }
        .kanban-quick-action.success {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.25);
          color: #10b981;
        }
        .kanban-empty-zone {
          padding: 45px 16px;
          text-align: center;
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }

        /* SLIDE DRAWER */
        .slide-drawer-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.68);
          backdrop-filter: blur(8px);
          z-index: 1050;
          display: flex;
          justify-content: flex-end;
          animation: drawerBackdropFade 0.25s ease-out;
        }
        .slide-drawer-panel {
          width: 100%;
          max-width: 550px;
          background: #0b1120;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          height: 100%;
          display: flex;
          flex-direction: column;
          animation: drawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: -15px 0 50px rgba(0, 0, 0, 0.7);
        }
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes drawerBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .drawer-x-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .drawer-x-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
        .drawer-subheading {
          font-size: 0.72rem;
          font-weight: 850;
          letter-spacing: 0.08em;
          color: #94a3b8;
          text-transform: uppercase;
          display: block;
          margin-bottom: 10px;
        }
        .drawer-spec-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .spec-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 12px;
        }
        .spec-label {
          display: block;
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .spec-val {
          font-size: 0.78rem;
          font-weight: 700;
        }
        .synopsis-box {
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 14px;
          font-size: 0.82rem;
          line-height: 1.5;
          color: #cbd5e1;
        }
        .audit-event-count {
          padding: 2px 7px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 750;
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
        }
        .audit-timeline {
          position: relative;
          padding-left: 20px;
          border-left: 1px solid rgba(56, 189, 248, 0.2);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .timeline-node {
          position: relative;
        }
        .node-marker {
          position: absolute;
          left: -24px;
          top: 4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
        }
        .node-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 8px 12px;
        }
        .node-author {
          font-size: 0.72rem;
          font-weight: 800;
          color: #38bdf8;
        }
        .node-time {
          font-size: 0.68rem;
          color: #64748b;
        }
        .node-text {
          font-size: 0.75rem;
          color: #cbd5e1;
        }
        .drawer-note-input {
          height: 38px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 10px;
          padding: 0 12px;
          color: #ffffff;
          font-size: 0.78rem;
          outline: none;
        }
        .drawer-note-input:focus { border-color: #38bdf8; }

        /* MODAL STYLES */
        .modal-body-shell {
          background: #0c1222 !important;
          border: 1px solid rgba(56, 189, 248, 0.25) !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85) !important;
        }
        .modal-lead-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-title-heading {
          font-size: 0.96rem;
          font-weight: 850;
          letter-spacing: 0.04em;
          color: #ffffff;
        }
        .luxury-form-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .luxury-form-input {
          width: 100%;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 10px;
          padding: 9px 12px;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 600;
          outline: none;
          transition: all 0.2s ease;
        }
        .luxury-form-input:focus {
          border-color: #38bdf8;
          background: rgba(15, 23, 42, 0.95);
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.2);
        }
        .luxury-form-input optgroup {
          background: #0f172a;
          color: #38bdf8;
          font-weight: 800;
        }
        .luxury-form-input option {
          background: #0b1120;
          color: #fff;
          font-weight: 500;
        }

        /* SUBITEM CHIPS IN MODAL */
        .subitem-chips-panel {
          background: rgba(56, 189, 248, 0.04);
          border: 1px dashed rgba(56, 189, 248, 0.2);
          border-radius: 10px;
          padding: 8px 12px;
        }
        .subitem-chip-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          font-size: 0.7rem;
          font-weight: 650;
          padding: 3px 10px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .subitem-chip-btn .chip-bullet { color: #64748b; }
        .subitem-chip-btn:hover {
          background: rgba(56, 189, 248, 0.14);
          border-color: rgba(56, 189, 248, 0.35);
          color: #38bdf8;
        }
        .subitem-chip-btn.active {
          background: rgba(56, 189, 248, 0.22);
          border-color: #38bdf8;
          color: #38bdf8;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
        }
        .subitem-chip-btn.active .chip-bullet { color: #38bdf8; }

        /* TOAST */
        .luxury-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: rgba(15, 23, 42, 0.94);
          border: 1px solid rgba(56, 189, 248, 0.35);
          backdrop-filter: blur(16px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.2);
          border-radius: 12px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 2000;
          animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes toastIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .toast-sparkle-ring {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast-text {
          font-size: 0.78rem;
          font-weight: 700;
          color: #ffffff;
        }
        .toast-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }
        .toast-close:hover { color: #fff; }

        .delete-alert-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.4); }
      `}} />
    </div>
  );
};

export default TicketingSystem;
