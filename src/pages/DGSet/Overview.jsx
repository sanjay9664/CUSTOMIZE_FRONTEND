import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Card, Badge, ProgressBar, Toast, ToastContainer, Table, Form, Button, InputGroup, Spinner } from 'react-bootstrap';
import { 
  ShieldAlert, Zap, Activity, Gauge, Fuel, History, 
  Settings, FileDown, Home, Database, TrendingDown,
  Building2, Layers, Cpu, Search, Play, Square, RotateCcw, 
  AlertOctagon, Info, LayoutGrid, ListFilter, Sliders, CheckCircle2,
  AlertCircle, ChevronRight, RefreshCw, RefreshCcw, Radio, Maximize2, Sun, Moon,
  Tag, MapPin, Clock, ChevronDown, ChevronUp, Thermometer, Droplets, Calendar, Upload, Image as ImageIcon
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiClient, normalizeList, getAuthHeaders } from '../../services/apiClient';
import PageContextBanner from '../../components/PageContextBanner';
import PdfButton from '../../components/PdfButton';
import { useSiteStore } from '../../context/SiteContext';
import bmsService from '../../services/bmsService';
import { getApiUrl } from '../../utils/apiConfig';

// FULL 35 PARAMETERS DEFINITION (NO DUMMY FAKE DATA - ALL TELEMETRY MAPPED WITH RICH ICONS)
const SYSTEM_35_PARAMS = [
  // 01. CHANGE (1)
  { id: 1, num: '01', name: 'Battery Voltage', category: 'CHANGE', catCode: '01', unit: 'V', defaultVal: '--', icon: Zap },

  // 02. PARM (9)
  { id: 2, num: '02', name: 'Coolant Temperature', category: 'PARM', catCode: '02', unit: '°C', defaultVal: '--', icon: Thermometer },
  { id: 3, num: '03', name: 'Oil Pressure', category: 'PARM', catCode: '02', unit: 'kPA', defaultVal: '--', icon: Gauge },
  { id: 4, num: '04', name: 'Engine Speed', category: 'PARM', catCode: '02', unit: 'RPM', defaultVal: '--', icon: Activity },
  { id: 5, num: '05', name: 'Frequency (R Phase)', category: 'PARM', catCode: '02', unit: 'Hz', defaultVal: '--', icon: Radio },
  { id: 6, num: '06', name: 'Generator L1-L2 voltage', category: 'PARM', catCode: '02', unit: 'V', defaultVal: '--', icon: Zap },
  { id: 7, num: '07', name: 'Generator L1 current', category: 'PARM', catCode: '02', unit: 'A', defaultVal: '--', icon: Activity },
  { id: 8, num: '08', name: 'Generator L2 current', category: 'PARM', catCode: '02', unit: 'A', defaultVal: '--', icon: Activity },
  { id: 9, num: '09', name: 'Generator L3 current', category: 'PARM', catCode: '02', unit: 'A', defaultVal: '--', icon: Activity },
  { id: 10, num: '10', name: 'Generator average power factor', category: 'PARM', catCode: '02', unit: 'pf', defaultVal: '--', icon: TrendingDown },

  // 03. ENGINE (6)
  { id: 11, num: '11', name: 'Engine Run tim', category: 'ENGINE', catCode: '03', unit: 'RPM/HRS', defaultVal: '--', icon: History },
  { id: 12, num: '12', name: 'No of start', category: 'ENGINE', catCode: '03', unit: 'Starts', defaultVal: '--', icon: RefreshCw },
  { id: 13, num: '13', name: 'Fuel Level', category: 'ENGINE', catCode: '03', unit: '%', defaultVal: '--', icon: Fuel },
  { id: 14, num: '14', name: 'KW Hours', category: 'ENGINE', catCode: '03', unit: 'KWH', defaultVal: '--', icon: Zap },
  { id: 15, num: '15', name: 'KVA Hours', category: 'ENGINE', catCode: '03', unit: 'KVAH', defaultVal: '--', icon: Zap },
  { id: 16, num: '16', name: 'KVAR Hours', category: 'ENGINE', catCode: '03', unit: 'kVARH', defaultVal: '--', icon: Zap },

  // 04. TOTAL (5)
  { id: 17, num: '17', name: 'Generator Total Watts', category: 'TOTAL', catCode: '04', unit: 'KW', defaultVal: '--', icon: Zap },
  { id: 18, num: '18', name: 'Generator total VA', category: 'TOTAL', catCode: '04', unit: 'KVA', defaultVal: '--', icon: Zap },
  { id: 19, num: '19', name: 'Generator total Var', category: 'TOTAL', catCode: '04', unit: 'KVAR', defaultVal: '--', icon: Zap },
  { id: 20, num: '20', name: 'Generator L-N voltage average', category: 'TOTAL', catCode: '04', unit: 'V', defaultVal: '--', icon: Zap },
  { id: 21, num: '21', name: 'Generator low voltage', category: 'TOTAL', catCode: '04', unit: 'V', defaultVal: '--', icon: TrendingDown },

  // 05. FAULT (14)
  { id: 22, num: '22', name: 'Generator high voltage', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Zap },
  { id: 23, num: '23', name: 'Generator low frequency', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Radio },
  { id: 24, num: '24', name: 'Generator high frequency', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Radio },
  { id: 25, num: '25', name: 'Generator high current', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Activity },
  { id: 26, num: '26', name: 'Low battery voltage', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Zap },
  { id: 27, num: '27', name: 'High battery voltage', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Zap },
  { id: 28, num: '28', name: 'Generator kW Overload', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Gauge },
  { id: 29, num: '29', name: 'Emergency Stop', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: AlertOctagon },
  { id: 30, num: '30', name: 'Low oil pressure', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: false, icon: Gauge },
  { id: 31, num: '31', name: 'High coolant temperature', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Thermometer },
  { id: 32, num: '32', name: 'Under speed', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: TrendingDown },
  { id: 33, num: '33', name: 'Over speed', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Gauge },
  { id: 34, num: '34', name: 'Fail to start', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: ShieldAlert },
  { id: 35, num: '35', name: 'Fail to come to rest', category: 'FAULT', catCode: '05', unit: 'Status', defaultVal: '--', isAlarm: true, icon: Square }
];

const SiemensStyleDG = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { deviceId: routeDeviceId } = useParams();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [paramSearch, setParamSearch] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false); // Closed by default until turned ON
  const [collapsedCategories, setCollapsedCategories] = useState({
    CHANGE: false,
    PARM: false,
    ENGINE: false,
    TOTAL: false,
    FAULT: false
  });

  const toggleCategoryCollapse = (cat) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  useEffect(() => {
    if (routeDeviceId) {
      setSelectedDeviceId(String(routeDeviceId));
    }
  }, [routeDeviceId]);

  // ── SITE & GENERATOR DEVICE STATES (PageContextBanner integration) ──
  const { sites: storeSites, selectedSite, setSelectedSite } = useSiteStore();
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return localStorage.getItem('selected_dg_site_id') || '';
  });
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem('selected_dg_device_id') || '';
  });
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [isFetchingTelemetry, setIsFetchingTelemetry] = useState(false);
  const [lastTelemetryAt, setLastTelemetryAt] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── MANUAL CONTROL & TOAST NOTIFICATION STATES ──
  const [isManualRunning, setIsManualRunning] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToastMsg, setShowToastMsg] = useState(false);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToastMsg(true);
    setTimeout(() => setShowToastMsg(false), 3500);
  };

  const handleStartEngine = () => {
    setIsManualRunning(true);
    triggerToast('🟢 DG Engine Started: 1500 RPM | 50.0 Hz Operating');
  };

  const handleStopEngine = () => {
    setIsManualRunning(false);
    triggerToast('🔴 DG Engine Stop Initiated: Returning to IDLE');
  };

  const handleResetEngine = () => {
    setIsManualRunning(false);
    triggerToast('🔄 DG Alarm & Parameter Diagnostics Reset Completed');
  };

  const handleEmergencyStop = () => {
    setIsManualRunning(false);
    triggerToast('⚠️ EMERGENCY STOP ACTIVATED: Engine Tripped & Isolated');
  };

  // ── CUSTOM DG SET IMAGE UPLOAD & RESTORE PREVIOUS STATE ──
  const DEFAULT_DG_IMAGE = '/dg_set.png';
  const [customDgImage, setCustomDgImage] = useState(() => {
    return localStorage.getItem('custom_dg_image') || DEFAULT_DG_IMAGE;
  });

  useEffect(() => {
    if (!selectedDeviceId) return;
    const devImg = localStorage.getItem(`custom_dg_image_${selectedDeviceId}`);
    if (devImg) {
      setCustomDgImage(devImg);
    } else {
      const globalImg = localStorage.getItem('custom_dg_image');
      setCustomDgImage(globalImg || DEFAULT_DG_IMAGE);
    }
  }, [selectedDeviceId]);

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Image file size should be less than 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setCustomDgImage(base64);
        if (selectedDeviceId) {
          localStorage.setItem(`custom_dg_image_${selectedDeviceId}`, base64);
        }
        localStorage.setItem('custom_dg_image', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    setCustomDgImage(DEFAULT_DG_IMAGE);
    if (selectedDeviceId) {
      localStorage.removeItem(`custom_dg_image_${selectedDeviceId}`);
    }
    localStorage.removeItem('custom_dg_image');
  };

  const isRealSiteName = (name) => {
    if (!name || typeof name !== 'string') return false;
    const clean = name.trim().toUpperCase();
    const invalidNames = new Set(['SELECT SITE / LOCATION', 'SELECT SITE', 'NONE', 'NULL', 'UNDEFINED']);
    return clean && !invalidNames.has(clean);
  };

  // 1. Sync & Load Real Sites
  useEffect(() => {
    if (Array.isArray(storeSites) && storeSites.length > 0) {
      setSites(storeSites);
      if (!selectedSiteId || !storeSites.some(s => String(s.id || s.siteId) === String(selectedSiteId))) {
        const initialSite = selectedSite?.id ? String(selectedSite.id) : String(storeSites[0].id || storeSites[0].siteId);
        setSelectedSiteId(initialSite);
        localStorage.setItem('selected_dg_site_id', initialSite);
        if (setSelectedSite && !selectedSite) {
          setSelectedSite(storeSites[0]);
        }
      }
      return;
    }

    const loadSites = async () => {
      const siteMap = new Map();
      try {
        const res = await apiClient.get('/sites').catch(() => null);
        const list = normalizeList(res, 'sites');
        if (Array.isArray(list)) {
          list.forEach(s => {
            if (s && (s.id || s.siteId || s.name)) {
              const id = String(s.id || s.siteId || s._id || s.name);
              const name = String(s.name || s.label || s.title || id).trim();
              if (isRealSiteName(name)) siteMap.set(id, { id, name });
            }
          });
        }
      } catch (e) {}

      if (siteMap.size === 0) {
        try {
          const scadaSitesDb = localStorage.getItem('scada_sites_db');
          if (scadaSitesDb) {
            const parsed = JSON.parse(scadaSitesDb);
            if (Array.isArray(parsed)) {
              parsed.forEach(s => {
                if (s && (s.name || s.label) && isRealSiteName(s.name || s.label)) {
                  const id = String(s.id || s.siteId || s.name);
                  if (!siteMap.has(id)) siteMap.set(id, { id, name: s.name || s.label });
                }
              });
            }
          }
        } catch (e) {}
      }

      const sitesList = Array.from(siteMap.values());
      setSites(sitesList);
      if (sitesList.length > 0) {
        const initialId = (selectedSiteId && sitesList.some(s => String(s.id) === String(selectedSiteId)))
          ? selectedSiteId
          : sitesList[0].id;
        setSelectedSiteId(initialId);
        localStorage.setItem('selected_dg_site_id', initialId);
        if (setSelectedSite) {
          setSelectedSite(sitesList.find(s => String(s.id) === String(initialId)) || sitesList[0]);
        }
      }
    };
    loadSites();
  }, [storeSites, selectedSite, selectedSiteId, setSelectedSite]);

  // Keep selected site synchronized with available sites
  useEffect(() => {
    if (sites.length > 0 && selectedSiteId) {
      const match = sites.find(s => String(s.id || s.siteId) === String(selectedSiteId));
      if (match && setSelectedSite && selectedSite?.id !== match.id) {
        setSelectedSite(match);
      }
    }
  }, [sites, selectedSiteId, setSelectedSite, selectedSite]);

  // 2. Load Generator Devices for selectedSiteId (Category: GENERATOR)
  useEffect(() => {
    if (!selectedSiteId) {
      setDevices([]);
      setSelectedDeviceId('');
      return;
    }

    let isMounted = true;
    const fetchGeneratorDevices = async () => {
      setDevicesLoading(true);
      try {
        const queryParams = new URLSearchParams({
          siteId: String(selectedSiteId),
          category: 'GENERATOR',
          include: 'settings,rules,profile'
        });
        const url = getApiUrl(`/devices?${queryParams.toString()}`);
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });

        let items = [];
        if (res && res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.data)) {
            items = json.data;
          } else if (Array.isArray(json)) {
            items = json;
          }
        } else {
          // Fallback via apiClient
          const fallbackRes = await apiClient.get('/devices', { 
            siteId: String(selectedSiteId), 
            category: 'GENERATOR', 
            include: 'settings,rules,profile' 
          }).catch(() => null);
          const list = normalizeList(fallbackRes, 'devices');
          if (Array.isArray(list) && list.length > 0) {
            items = list;
          }
        }

        if (isMounted) {
          setDevices(items);
          if (items.length > 0) {
            const currentInList = items.some(d => String(d.id || d.deviceId) === String(selectedDeviceId));
            const storedId = localStorage.getItem('selected_dg_device_id');
            const storedInList = items.find(d => String(d.id || d.deviceId) === String(storedId));

            if (currentInList) {
              // keep current
            } else if (storedInList) {
              setSelectedDeviceId(String(storedInList.id || storedInList.deviceId));
            } else {
              const firstId = String(items[0].id || items[0].deviceId);
              setSelectedDeviceId(firstId);
              localStorage.setItem('selected_dg_device_id', firstId);
            }
          } else {
            setSelectedDeviceId('');
            localStorage.removeItem('selected_dg_device_id');
          }
        }
      } catch (err) {
        console.warn('Error fetching generator devices:', err);
        if (isMounted) {
          setDevices([]);
          setSelectedDeviceId('');
        }
      } finally {
        if (isMounted) setDevicesLoading(false);
      }
    };

    fetchGeneratorDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  const selectedSiteObj = useMemo(() => {
    return sites.find(s => String(s.id || s._id || s.siteId) === String(selectedSiteId)) || null;
  }, [sites, selectedSiteId]);

  const selectedDevObj = useMemo(() => {
    if (!devices || devices.length === 0) return null;
    return devices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId)) || devices[0];
  }, [devices, selectedDeviceId]);

  const isDeviceConfigured = Boolean(devices && devices.length > 0 && selectedDevObj);

  const isDeviceOnline = useMemo(() => {
    if (!isDeviceConfigured || !selectedDevObj) return false;
    if (selectedDevObj.status) {
      const s = String(selectedDevObj.status).toUpperCase();
      if (s === 'ONLINE' || s === 'ACTIVE') return true;
      if (s === 'OFFLINE' || s === 'INACTIVE' || s === 'DISABLED') return false;
    }
    if (selectedDevObj.lastSeenAt) {
      const lastSeenMs = new Date(selectedDevObj.lastSeenAt).getTime();
      if (Math.abs(Date.now() - lastSeenMs) < 15 * 60 * 1000) return true;
    }
    if (lastTelemetryAt && (Date.now() - lastTelemetryAt) < 24 * 3600 * 1000) {
      return true;
    }
    return false;
  }, [isDeviceConfigured, selectedDevObj, lastTelemetryAt]);

  const activeDeviceDisplayName = selectedDevObj?.name || selectedDevObj?.deviceName || (isDeviceConfigured ? `Generator #${selectedDeviceId}` : 'No device configured');

  // Clean Telemetry State (NO FAKE DUMMY NUMBERS)
  const [showToast, setShowToast] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const userRole = (localStorage.getItem('userRole') || 'user').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const defaultCleanState = {
    voltage: { ry: null, yb: null, br: null, rn: null, yn: null, bn: null },
    current: { r: null, y: null, b: null, avg: null },
    power: { kw: null, kvar: null, kva: null, pf: null },
    engine: { coolant: null, oilPressure: null, oilTemp: null, speed: null, runtime: null, freq: null, battery: null, starts: null, status: null },
    diesel: { level: null, remaining: null, capacity: 2000, spentToday: null, efficiency: null, lastFill: '--' },
    generation: { today: null, kvaHours: null, kvarHours: null, month: null }
  };

  const [data, setData] = useState(defaultCleanState);
  const [backendEvents, setBackendEvents] = useState({});

  const isEngineRunning = useMemo(() => {
    if (isManualRunning) return true;
    if (data?.engine?.speed !== null && data?.engine?.speed !== undefined && Number(data.engine.speed) > 0) return true;
    if (data?.power?.kw !== null && data?.power?.kw !== undefined && Number(data.power.kw) > 0) return true;
    return false;
  }, [isManualRunning, data]);

  // 3. Live Telemetry Parser & 30s Polling Effect
  const fetchDeviceTelemetry = useCallback(async () => {
    if (!selectedDeviceId || !isDeviceConfigured) return;
    setIsFetchingTelemetry(true);
    try {
      const eventsRes = await bmsService.getDeviceEventsLatest(selectedDeviceId, selectedSiteId).catch(() => null);

      let newData = { ...defaultCleanState };
      let updated = false;

      // Extract fields from eventsRes payload safely (supporting object with .fields, .data.fields, or array)
      const eventsList = [];
      const candidateSources = [
        eventsRes?.fields,
        eventsRes?.data?.fields,
        eventsRes?.data?.data?.fields,
        eventsRes?.events,
        eventsRes?.data?.events,
        Array.isArray(eventsRes) ? eventsRes : null,
        Array.isArray(eventsRes?.data) ? eventsRes.data : null
      ];

      candidateSources.forEach(src => {
        if (Array.isArray(src)) {
          src.forEach(item => {
            if (item && Array.isArray(item.eventFields)) {
              eventsList.push(...item.eventFields);
            } else if (item && (item.eventFieldDisplayName || item.displayName || item.fieldName || item.name)) {
              eventsList.push(item);
            }
          });
        }
      });

      const eventsMap = {};

      if (Array.isArray(eventsList) && eventsList.length > 0) {
        eventsList.forEach(f => {
          const rawDispName = String(f.eventFieldDisplayName || f.displayName || f.fieldName || '').trim();
          const dispName = rawDispName.toLowerCase();
          const val = f.fieldCurrentValue ?? f.currentValue ?? f.value;

          if (val !== undefined && val !== null && !isNaN(Number(val))) {
            const num = Number(val);
            updated = true;
            if (rawDispName) {
              eventsMap[rawDispName] = { val: num, unit: f.unit || '' };
            }

            if (dispName.includes('speed') || dispName.includes('rpm')) newData.engine.speed = num;
            else if (dispName.includes('coolant')) newData.engine.coolant = num;
            else if (dispName.includes('oil pressure') || dispName.includes('oil')) newData.engine.oilPressure = num;
            else if (dispName.includes('frequency') || dispName.includes('freq')) newData.engine.freq = num;
            else if (dispName.includes('battery')) newData.engine.battery = num;
            else if (dispName.includes('run tim') || dispName.includes('runtime')) newData.engine.runtime = num;
            else if (dispName.includes('starts') || dispName.includes('start')) newData.engine.starts = num;
            else if (dispName.includes('total watts') || dispName.includes('active power') || dispName.includes('kw')) newData.power.kw = num;
            else if (dispName.includes('apparent power') || dispName.includes('kva')) newData.power.kva = num;
            else if (dispName.includes('reactive power') || dispName.includes('kvar')) newData.power.kvar = num;
            else if (dispName.includes('power factor') || dispName.includes('pf')) newData.power.pf = num;
            else if (dispName.includes('fuel level') || dispName.includes('fuel')) {
              newData.diesel.level = num;
              newData.diesel.remaining = (newData.diesel.capacity * num) / 100;
            }
            else if (dispName.includes('l1-l2') || dispName.includes('l1 - l2')) newData.voltage.ry = num;
            else if (dispName.includes('l2-l3') || dispName.includes('l2 - l3')) newData.voltage.yb = num;
            else if (dispName.includes('l3-l1') || dispName.includes('l3 - l1')) newData.voltage.br = num;
            else if (dispName.includes('l1 current')) newData.current.r = num;
            else if (dispName.includes('l2 current')) newData.current.y = num;
            else if (dispName.includes('l3 current')) newData.current.b = num;
          }
        });
      }

      if (Object.keys(eventsMap).length > 0) {
        setBackendEvents(eventsMap);
      }

      if (updated) {
        setData(newData);
        setLastTelemetryAt(Date.now());
      }
    } catch (err) {
      console.warn('Error fetching DG telemetry:', err);
    } finally {
      setIsFetchingTelemetry(false);
    }
  }, [selectedDeviceId, selectedSiteId]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    fetchDeviceTelemetry();
    const interval = setInterval(fetchDeviceTelemetry, 30000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, fetchDeviceTelemetry]);

  // Site selector configuration for PageContextBanner
  const siteSelector = useMemo(() => {
    const siteOptions = (sites && sites.length > 0)
      ? sites.map(s => ({
          value: String(s.id || s._id || s.siteId),
          label: s.name || s.siteName || s.title || `Site ${s.id}`
        }))
      : [{ value: '1', label: 'Main Facility Site' }];

    const currentVal = selectedSiteId || siteOptions[0]?.value;

    return {
      value: currentVal,
      options: siteOptions,
      onChange: (newId) => {
        setSelectedSiteId(newId);
        localStorage.setItem('selected_dg_site_id', String(newId));
        const found = sites?.find(s => String(s.id || s._id || s.siteId) === String(newId));
        if (found && setSelectedSite) {
          setSelectedSite(found);
        }
      },
      ariaLabel: 'Select Site'
    };
  }, [sites, selectedSiteId, setSelectedSite]);

  // Device selector configuration for PageContextBanner
  const deviceSelector = useMemo(() => {
    if (devicesLoading) {
      return {
        value: '',
        options: [{ value: '', label: 'Loading devices...' }],
        disabled: true,
        ariaLabel: 'Loading devices'
      };
    }

    if (!devices || devices.length === 0) {
      return {
        value: '',
        options: [{ value: '', label: 'No device configured' }],
        disabled: true,
        ariaLabel: 'No device configured'
      };
    }

    const uniqueDevices = [];
    const seenIds = new Set();
    for (const d of devices) {
      const id = String(d.id || d.deviceId || '');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      const name = d.name || d.deviceName || d.title || d.serialNumber || `Generator (${id})`;
      uniqueDevices.push({ id, name });
    }

    const deviceOptions = uniqueDevices.map(d => ({
      value: d.id,
      label: d.name
    }));

    const currentVal = (selectedDeviceId && deviceOptions.some(m => String(m.value) === String(selectedDeviceId)))
      ? String(selectedDeviceId)
      : (deviceOptions[0]?.value || '');

    return {
      value: currentVal,
      options: deviceOptions,
      onChange: (newId) => {
        if (!newId) return;
        setSelectedDeviceId(newId);
        localStorage.setItem('selected_dg_device_id', String(newId));
      },
      ariaLabel: 'Select Generator Device',
      disabled: false
    };
  }, [devices, devicesLoading, selectedDeviceId]);

  // Compute live value mapping & mapped status for each of the 35 Parameters
  const mapped35Parameters = useMemo(() => {
    if (!isDeviceConfigured) {
      return SYSTEM_35_PARAMS.map(param => ({
        ...param,
        liveVal: '--',
        isMapped: false,
        mappedField: null
      }));
    }

    let savedMappings = {};
    const keysToInspect = [
      'scada_templates',
      'scada_device_mappings',
      'dg_parameter_mappings',
      'bms_registered_devices',
      'scada_devices_db',
      'tb_devices',
      'dg_generator_devices'
    ];

    keysToInspect.forEach(storageKey => {
      try {
        const item = localStorage.getItem(storageKey);
        if (!item) return;
        const parsed = JSON.parse(item);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        list.forEach(t => {
          if (!t) return;
          const isDG =
            !selectedDeviceId ||
            String(t.id) === String(selectedDeviceId) ||
            String(t.deviceId) === String(selectedDeviceId) ||
            String(t.name || '').toLowerCase().includes(String(activeDeviceDisplayName || '').toLowerCase()) ||
            (t.category && String(t.category).toUpperCase().includes('GEN')) ||
            (t.module && String(t.module).toUpperCase().includes('DG')) ||
            (t.module && String(t.module).toUpperCase().includes('GEN')) ||
            t.module === 'DG Set' ||
            t.type === 'GENERATOR';

          if (isDG) {
            if (t.mapping && typeof t.mapping === 'object') {
              savedMappings = { ...savedMappings, ...t.mapping };
            }
            if (t.defaultValues && typeof t.defaultValues === 'object') {
              savedMappings = { ...savedMappings, ...t.defaultValues };
            }
            if (t.settings) {
              const s = Array.isArray(t.settings) ? t.settings[0]?.meta : t.settings;
              if (s && typeof s === 'object') savedMappings = { ...savedMappings, ...s };
            }
            if (t.parameters) {
              if (Array.isArray(t.parameters)) {
                t.parameters.forEach(p => {
                  if (p && p.name) savedMappings[p.name] = p.register || p.field || p.value || 'Mapped';
                });
              } else if (typeof t.parameters === 'object') {
                savedMappings = { ...savedMappings, ...t.parameters };
              }
            }
            Object.keys(t).forEach(k => {
              if (k !== 'id' && k !== 'name' && k !== 'category' && k !== 'module' && typeof t[k] === 'string' && t[k].trim() !== '') {
                savedMappings[k] = t[k];
              }
            });
          }
        });
      } catch (e) {}
    });

    if (selectedDevObj) {
      if (selectedDevObj.template?.mapping) savedMappings = { ...savedMappings, ...selectedDevObj.template.mapping };
      if (selectedDevObj.settings?.mapping) savedMappings = { ...savedMappings, ...selectedDevObj.settings.mapping };
      if (selectedDevObj.profile?.mapping) savedMappings = { ...savedMappings, ...selectedDevObj.profile.mapping };
      if (selectedDevObj.raw?.mapping) savedMappings = { ...savedMappings, ...selectedDevObj.raw.mapping };
    }

    return SYSTEM_35_PARAMS.map(param => {
      let liveVal = '--';
      let isMapped = false;
      let mappedField = null;

      // 1. Check direct backend events match
      const backendEventKeys = Object.keys(backendEvents);
      if (backendEventKeys.length > 0) {
        const paramLower = param.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedBackendKey = backendEventKeys.find(bk => {
          const bkLower = bk.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (bkLower === paramLower || bkLower.includes(paramLower) || paramLower.includes(bkLower)) return true;
          if (paramLower.includes('battery') && bkLower.includes('battery')) return true;
          if (paramLower.includes('coolant') && bkLower.includes('coolant')) return true;
          if (paramLower.includes('oil') && bkLower.includes('oil')) return true;
          if ((paramLower.includes('enginespeed') || paramLower.includes('speed')) && (bkLower.includes('speed') || bkLower.includes('rpm') || bkLower.includes('runningstatus'))) return true;
          if (paramLower.includes('frequency') && (bkLower.includes('freq') || bkLower.includes('frequency') || bkLower.includes('hz'))) return true;
          if ((paramLower.includes('engineruntim') || paramLower.includes('runtime')) && (bkLower.includes('runningstatus') || bkLower.includes('runtime') || bkLower.includes('hours'))) return true;
          if ((paramLower.includes('totalwatts') || paramLower.includes('activepower')) && (bkLower.includes('activepower') || bkLower.includes('totalwatts') || bkLower.includes('kw'))) return true;
          if ((paramLower.includes('totalva') || paramLower.includes('apparentpower')) && (bkLower.includes('apparentpower') || bkLower.includes('totalva') || bkLower.includes('kva'))) return true;
          if ((paramLower.includes('totalvar') || paramLower.includes('reactivepower')) && (bkLower.includes('reactivepower') || bkLower.includes('totalvar') || bkLower.includes('kvar'))) return true;
          if ((paramLower.includes('powerfactor') || paramLower.includes('pf')) && (bkLower.includes('powerfactor') || bkLower.includes('pf'))) return true;
          if (paramLower.includes('fuellevel') && bkLower.includes('fuel')) return true;
          if (paramLower.includes('l1current') || paramLower.includes('l2current') || paramLower.includes('l3current')) {
            if (bkLower.includes('current')) return true;
          }
          return false;
        });

        if (matchedBackendKey) {
          const entry = backendEvents[matchedBackendKey];
          isMapped = true;
          mappedField = matchedBackendKey;
          const displayUnit = param.unit || entry.unit || '';
          if (param.name === 'Battery Voltage') liveVal = `${entry.val.toFixed(1)} V`;
          else if (param.name === 'Coolant Temperature') liveVal = `${entry.val.toFixed(1)} °C`;
          else if (param.name === 'Engine Speed' || param.name === 'Running Status') liveVal = `${entry.val.toFixed(0)} RPM`;
          else if (param.name === 'Fuel Level') liveVal = `${entry.val.toFixed(0)}%`;
          else if (param.name === 'Generator average power factor') liveVal = `${entry.val.toFixed(2)} pf`;
          else liveVal = `${entry.val} ${displayUnit}`.trim();
        }
      }

      // 2. Fallback to state object if backend events matching did not populate
      if (!isMapped || liveVal === '--') {
        switch (param.name) {
          case 'Battery Voltage':
            if (data.engine.battery !== null) { liveVal = `${data.engine.battery.toFixed(1)} V`; isMapped = true; }
            break;
          case 'Coolant Temperature':
            if (data.engine.coolant !== null) { liveVal = `${data.engine.coolant.toFixed(1)} °C`; isMapped = true; }
            break;
          case 'Oil Pressure':
            if (data.engine.oilPressure !== null) { liveVal = `${data.engine.oilPressure.toFixed(1)} kPA`; isMapped = true; }
            break;
          case 'Engine Speed':
            if (data.engine.speed !== null) { liveVal = `${data.engine.speed.toFixed(0)} RPM`; isMapped = true; }
            break;
          case 'Frequency (R Phase)':
            if (data.engine.freq !== null) { liveVal = `${data.engine.freq.toFixed(1)} Hz`; isMapped = true; }
            break;
          case 'Generator L1-L2 voltage':
            if (data.voltage.ry !== null) { liveVal = `${data.voltage.ry.toFixed(0)} V`; isMapped = true; }
            break;
          case 'Generator L1 current':
            if (data.current.r !== null) { liveVal = `${data.current.r.toFixed(1)} A`; isMapped = true; }
            break;
          case 'Generator L2 current':
            if (data.current.y !== null) { liveVal = `${data.current.y.toFixed(1)} A`; isMapped = true; }
            break;
          case 'Generator L3 current':
            if (data.current.b !== null) { liveVal = `${data.current.b.toFixed(1)} A`; isMapped = true; }
            break;
          case 'Generator average power factor':
            if (data.power.pf !== null) { liveVal = `${data.power.pf.toFixed(2)} pf`; isMapped = true; }
            break;
          case 'Engine Run tim':
            if (data.engine.runtime !== null) { liveVal = `${data.engine.runtime} RPM/HRS`; isMapped = true; }
            break;
          case 'No of start':
            if (data.engine.starts !== null) { liveVal = `${data.engine.starts}`; isMapped = true; }
            break;
          case 'Fuel Level':
            if (data.diesel.level !== null) { liveVal = `${data.diesel.level.toFixed(0)}%`; isMapped = true; }
            break;
          case 'KW Hours':
            if (data.generation.today !== null) { liveVal = `${data.generation.today} KWH`; isMapped = true; }
            break;
          case 'KVA Hours':
            if (data.generation.kvaHours !== null) { liveVal = `${data.generation.kvaHours} KVAH`; isMapped = true; }
            break;
          case 'KVAR Hours':
            if (data.generation.kvarHours !== null) { liveVal = `${data.generation.kvarHours} kVARH`; isMapped = true; }
            break;
          case 'Generator Total Watts':
            if (data.power.kw !== null) { liveVal = `${data.power.kw.toFixed(1)} KW`; isMapped = true; }
            break;
          case 'Generator total VA':
            if (data.power.kva !== null) { liveVal = `${data.power.kva.toFixed(1)} KVA`; isMapped = true; }
            break;
          case 'Generator total Var':
            if (data.power.kvar !== null) { liveVal = `${data.power.kvar.toFixed(1)} KVAR`; isMapped = true; }
            break;
          case 'Generator L-N voltage average':
            if (data.voltage.rn !== null) { liveVal = `${data.voltage.rn.toFixed(0)} V`; isMapped = true; }
            break;
          default:
            break;
        }
      }

      // 3. Check savedMappings for template key match if still unmapped
      if (!isMapped) {
        const mappingKeys = Object.keys(savedMappings);
        if (mappingKeys.length > 0) {
          const paramLower = param.name.toLowerCase().replace(/[^a-z0-9]/g, '');

          const matchedKey = mappingKeys.find(k => {
            if (!k) return false;
            const val = savedMappings[k];
            if (!val || val === 'Unmapped' || val === 'NONE' || val === '') return false;

            const keyLower = k.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (keyLower === paramLower || paramLower.includes(keyLower) || keyLower.includes(paramLower)) return true;
            if (paramLower.includes('battery') && keyLower.includes('battery')) return true;
            if (paramLower.includes('coolant') && keyLower.includes('coolant')) return true;
            if (paramLower.includes('oil') && keyLower.includes('oil')) return true;
            if (paramLower.includes('speed') && keyLower.includes('speed')) return true;
            if (paramLower.includes('frequency') && (keyLower.includes('freq') || keyLower.includes('hz'))) return true;
            if (paramLower.includes('l1l2') && (keyLower.includes('l1l2') || keyLower.includes('linevoltage') || keyLower.includes('voltage'))) return true;
            if (paramLower.includes('l1current') && keyLower.includes('l1')) return true;
            if (paramLower.includes('l2current') && keyLower.includes('l2')) return true;
            if (paramLower.includes('l3current') && keyLower.includes('l3')) return true;
            if (paramLower.includes('powerfactor') && (keyLower.includes('powerfactor') || keyLower.includes('pf'))) return true;
            if (paramLower.includes('runtime') || paramLower.includes('runtim') || paramLower.includes('hours')) {
              if (keyLower.includes('runtime') || keyLower.includes('hours') || keyLower.includes('runtim')) return true;
            }
            if (paramLower.includes('start') && keyLower.includes('start')) return true;
            if (paramLower.includes('fuel') && keyLower.includes('fuel')) return true;
            if (paramLower.includes('kwhours') || paramLower.includes('kwh')) {
              if (keyLower.includes('kwh') || keyLower.includes('activeenergy')) return true;
            }
            if (paramLower.includes('kvahours') || paramLower.includes('kvah')) {
              if (keyLower.includes('kvah') || keyLower.includes('apparentenergy')) return true;
            }
            if (paramLower.includes('kvarhours') || paramLower.includes('kvarh')) {
              if (keyLower.includes('kvarh') || keyLower.includes('reactiveenergy')) return true;
            }
            if (paramLower.includes('totalwatts') || paramLower.includes('activepower')) {
              if (keyLower.includes('watts') || keyLower.includes('activepower') || keyLower.includes('kw')) return true;
            }
            if (paramLower.includes('totalva') || paramLower.includes('apparentpower')) {
              if (keyLower.includes('va') || keyLower.includes('apparentpower') || keyLower.includes('kva')) return true;
            }
            if (paramLower.includes('totalvar') || paramLower.includes('reactivepower')) {
              if (keyLower.includes('var') || keyLower.includes('reactivepower') || keyLower.includes('kvar')) return true;
            }
            return false;
          });

          if (matchedKey) {
            isMapped = true;
            mappedField = savedMappings[matchedKey];
            if (liveVal === '--') {
              const rawVal = typeof mappedField === 'object' ? (mappedField.value || mappedField.currentValue || mappedField.register || mappedField.field || '--') : String(mappedField);
              if (rawVal !== '--' && rawVal !== 'undefined') {
                liveVal = rawVal.includes(param.unit || '') ? rawVal : `${rawVal} ${param.unit || ''}`.trim();
              }
            }
          }
        }
      }

      return { ...param, liveVal, isMapped, mappedField };
    });
  }, [data, backendEvents, selectedDeviceId, selectedDevObj, activeDeviceDisplayName, isDeviceConfigured]);

  // Filtered parameters by search & category
  const filtered35Parameters = useMemo(() => {
    let list = mapped35Parameters;
    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter(p => p.category === selectedCategoryFilter);
    }
    if (paramSearch.trim()) {
      const term = paramSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
    }
    return list;
  }, [mapped35Parameters, selectedCategoryFilter, paramSearch]);

  // Categorized groups
  const categorizedGroups = useMemo(() => {
    const groups = { 'CHANGE': [], 'PARM': [], 'ENGINE': [], 'TOTAL': [], 'FAULT': [] };
    filtered35Parameters.forEach(p => {
      if (groups[p.category]) groups[p.category].push(p);
      else groups['PARM'].push(p);
    });
    return groups;
  }, [filtered35Parameters]);

  const handlePdfDownload = () => {
    setGeneratingPdf(true);
    try {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleString();
        
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text(`DG SET 35 PARAMETERS TELEMETRY REPORT`, 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${dateStr} | Device: ${activeDeviceDisplayName}`, 14, 30);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 36, 196, 36);

        autoTable(doc, {
            startY: 42,
            head: [['#', 'Cat Code', 'Category', 'Parameter Name', 'Live Value / Status']],
            body: mapped35Parameters.map(p => [p.num, p.catCode, p.category, p.name, p.liveVal]),
            theme: 'striped',
            headStyles: { fillColor: [14, 165, 233], textColor: 255, fontWeight: 'bold' },
            styles: { fontSize: 9, cellPadding: 4 }
        });

        doc.save(`DG_35_PARAMETERS_${activeDeviceDisplayName.replace(/\s+/g, '_')}.pdf`);
        setShowToast(true);
    } catch (e) {
        console.error('Error generating PDF', e);
    } finally {
        setGeneratingPdf(false);
    }
  };

  return (
    <div id="pdf-content" className="fade-in main-meter-workspace dg-premium-page min-vh-100">
      {/* ACTION TOAST FEEDBACK NOTIFICATION */}
      {showToastMsg && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className="toast show align-items-center text-white bg-dark border border-info shadow-2xl rounded-3 p-2.5">
            <div className="d-flex align-items-center gap-2">
              <Activity className="text-success pulse-icon" size={18} />
              <div className="toast-body fs-12 fw-bold text-main">{toastMsg}</div>
            </div>
          </div>
        </div>
      )}

      {/* REUSABLE PAGE CONTEXT BANNER (MATCHING MAIN ENERGY METER) */}
      <PageContextBanner
        title={selectedDevObj ? (selectedDevObj.name || selectedDevObj.deviceName || 'DG Set') : 'DG Set'}
        icon={<Zap className={isDeviceConfigured ? "text-warning" : "text-secondary"} size={22} />}
        status={isDeviceConfigured ? (isDeviceOnline ? 'ONLINE' : 'OFFLINE') : 'NOT CONFIGURED'}
        siteSelector={siteSelector}
        deviceSelector={deviceSelector}
        metadata={[
          {
            icon: <Clock size={15} />,
            label: 'Realtime - last 1 day'
          }
        ]}
        actions={[
          <PdfButton
            key="pdf-export"
            label=""
            title="Download Custom PDF Report"
            variant="custom"
            className="context-banner-action-btn p-1 border-0"
            disabled={!isDeviceConfigured}
            onClick={handlePdfDownload}
          />
        ]}
        enableFullscreen={true}
        variant="scada"
        className="main-meter-context-banner"
      />

      {/* ═══ UNIFIED SINGLE PAGE DASHBOARD GRID (SKELETON ALWAYS DISPLAYED) ═══ */}
      <Row className="g-3 mt-1">
        {/* LEFT COLUMN: HERO GENERATOR VISUAL UNIT (BIGGER IMAGE) & OPERATING STATUS */}
        <Col xl={4} lg={5}>
          <div className="d-flex flex-column gap-2.5">
            {/* HERO GENERATOR UNIT CARD (CLEAN VIEW WITH CUSTOM UPLOAD & RESET OPTIONS) */}
            <div className="dg-glass-card p-3 position-relative overflow-hidden dg-hero-card">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div className="fw-bold fs-12 text-cyan-glow uppercase tracking-wider d-flex align-items-center gap-2">
                  <Cpu size={14} className="text-info" /> DG Digital Twin Showcase
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
                  {/* UPLOAD & RESET BUTTONS ONLY WHEN DEVICE IS CONFIGURED */}
                  {isDeviceConfigured && (
                    <>
                      <label className="btn btn-xs dg-btn-outline-glass d-flex align-items-center gap-1.5 cursor-pointer mb-0 text-cyan-glow py-1 px-2.5 rounded-2" title="Upload your custom DG Set photo">
                        <Upload size={13} />
                        <span className="fs-12 fw-medium">Upload DG</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>

                      {customDgImage !== DEFAULT_DG_IMAGE && (
                        <button 
                          onClick={handleResetImage} 
                          className="btn btn-xs btn-outline-warning d-flex align-items-center gap-1.5 py-1 px-2.5 fs-12 rounded-2"
                          title="Restore original default DG image"
                        >
                          <RotateCcw size={13} />
                          <span className="fw-medium">Reset Image</span>
                        </button>
                      )}
                    </>
                  )}

                  <Badge bg={isDeviceConfigured ? (isDeviceOnline ? "success" : "secondary") : "secondary"} className="px-2.5 py-1 fs-12 uppercase rounded-pill border border-opacity-30 fw-semibold ms-1">
                    <Activity size={10} className="me-1 pulse-icon" /> {isDeviceConfigured ? (isDeviceOnline ? "ONLINE" : "OFFLINE") : "UNCONFIGURED"}
                  </Badge>
                </div>
              </div>

              {/* 100% CLEAN STILL HIGH-DEF GENERATOR IMAGE FRAME (OR UNCONFIGURED SKELETON STATE) */}
              <div className="position-relative rounded-4 overflow-hidden border border-white border-opacity-15 shadow-2xl dg-generator-hero-frame bg-dark">
                {!isDeviceConfigured ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center px-3 py-5 select-none" style={{ minHeight: '360px' }}>
                    {/* Dashed circular boundary */}
                    <div 
                      className="d-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        border: '1.5px dashed rgba(56, 189, 248, 0.45)',
                        background: 'rgba(56, 189, 248, 0.03)'
                      }}
                    >
                      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="7" width="18" height="13" rx="2" />
                        <line x1="3" y1="11" x2="21" y2="11" />
                        <line x1="7" y1="15" x2="10" y2="15" />
                        <path d="M15 4a3 3 0 0 1 3 3" />
                        <path d="M13 2a6 6 0 0 1 6 6" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="#38bdf8" strokeWidth="1.8" />
                      </svg>
                    </div>

                    <h5 className="fw-bold text-white mb-2" style={{ fontSize: '1.05rem', letterSpacing: '0.2px' }}>
                      No device configured for this site
                    </h5>

                    <p className="text-secondary mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.45', maxWidth: '240px' }}>
                      Configure a device to view live telemetry, generator readings and SCADA data.
                    </p>
                  </div>
                ) : (
                  <img 
                    src={customDgImage || DEFAULT_DG_IMAGE} 
                    alt="DG Generator Unit" 
                    className="img-fluid dg-hero-img" 
                    style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }} 
                    onError={(e) => { e.target.src = DEFAULT_DG_IMAGE; }}
                  />
                )}
              </div>
            </div>

            {/* DEDICATED REALISTIC FUEL TANK MANAGEMENT CARD (CONSOLIDATED IN ONE PLACE) */}
            <div className="dg-glass-card p-3">
              <div className="fw-bold fs-12 text-warning mb-3 uppercase tracking-wider d-flex align-items-center gap-2">
                <Fuel size={16} /> DEDICATED FUEL MANAGEMENT
              </div>

              <Row className="g-3 align-items-center">
                <Col xs={5} className="d-flex justify-content-center">
                  {/* REALISTIC DIESEL FUEL TANK WITH FLUID SVG WAVES & RISING BUBBLES */}
                  <div className="dg-realistic-fuel-tank">
                    <div className="dg-tank-sheen"></div>
                    
                    {/* ACCURATE TICK MARKS */}
                    <div className="dg-tank-ticks">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                    </div>

                    {/* LIQUID FILL WITH BUBBLES & WAVE SURFACE */}
                    <div className="dg-fluid-fill" style={{ height: `${isDeviceConfigured && data.diesel.level !== null ? Math.min(Math.max(data.diesel.level, 0), 100) : 0}%` }}>
                      {/* DYNAMIC SURFACE GLOW LINE */}
                      <div className="dg-fluid-surface-glow"></div>
                      
                      {/* BUBBLE ANIMATIONS */}
                      <div className="dg-bubble b1"></div>
                      <div className="dg-bubble b2"></div>
                      <div className="dg-bubble b3"></div>

                      {/* DUAL LAYER FLUID WAVE ANIMATION */}
                      <svg className="dg-fluid-wave wave-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"></path>
                      </svg>
                      <svg className="dg-fluid-wave wave-front" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,30 C200,-20 400,80 600,20 C800,-40 1000,70 1200,10 L1200,120 L0,120 Z"></path>
                      </svg>
                    </div>

                    {/* CENTER GLASS BADGE WITH READABLE NUMBER & LABEL */}
                    <div className="dg-tank-center-badge">
                      <div className="dg-tank-val">{isDeviceConfigured && data.diesel.level !== null ? `${data.diesel.level.toFixed(0)}%` : '-- %'}</div>
                      <div className="dg-tank-lbl">Level %</div>
                    </div>
                  </div>
                </Col>

                <Col xs={7}>
                  <div className="d-flex flex-column gap-2.5">
                    <div className="dg-fuel-tile warning">
                      <div className="d-flex align-items-center gap-2">
                        <div className="dg-fuel-tile-icon warning"><Droplets size={14} /></div>
                        <span className="dg-fuel-tile-lbl">Remaining Ltrs</span>
                      </div>
                      <span className="dg-fuel-tile-val warning">{isDeviceConfigured && data.diesel.remaining !== null ? `${data.diesel.remaining.toFixed(0)} L` : '--'}</span>
                    </div>

                    <div className="dg-fuel-tile danger">
                      <div className="d-flex align-items-center gap-2">
                        <div className="dg-fuel-tile-icon danger"><TrendingDown size={14} /></div>
                        <span className="dg-fuel-tile-lbl">Today Used</span>
                      </div>
                      <span className="dg-fuel-tile-val danger">{isDeviceConfigured && data.diesel.spentToday !== null ? `${data.diesel.spentToday.toFixed(1)} L` : '--'}</span>
                    </div>

                    <div className="dg-fuel-tile info">
                      <div className="d-flex align-items-center gap-2">
                        <div className="dg-fuel-tile-icon info"><Calendar size={14} /></div>
                        <span className="dg-fuel-tile-lbl">Refill Date</span>
                      </div>
                      <span className="dg-fuel-tile-val info">{isDeviceConfigured ? data.diesel.lastFill : '--'}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>

        {/* CENTER COLUMN: UNIFIED 35 PARAMETERS MATRIX SHOWCASE (COMPACT TILES) */}
        <Col xl={5} lg={7}>
          <div className="dg-glass-card p-3 h-100">
            {/* HEADER & SEARCH BAR */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom border-white border-opacity-10">
              <div className="d-flex align-items-center gap-2">
                <ListFilter size={18} className="text-cyan-glow" />
                <div>
                  <h6 className="fw-bold text-main mb-0">GENERATOR PARAMETERS MATRIX</h6>
                  <small className="text-dim fs-12">Total Parameters: <span className="text-cyan-glow fw-bold">35</span></small>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div style={{ minWidth: '190px' }}>
                <InputGroup size="sm" className="dg-search-group">
                  <InputGroup.Text className="bg-transparent border-0 text-muted ps-2.5">
                    <Search size={13} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search parameter..."
                    value={paramSearch}
                    onChange={(e) => setParamSearch(e.target.value)}
                    className="bg-transparent text-main border-0 fs-12 shadow-none focus-none"
                  />
                </InputGroup>
              </div>
            </div>

            {/* COMPACT CATEGORY FILTER CHIPS */}
            <div className="d-flex align-items-center gap-1.5 flex-wrap mb-3">
              {[
                { key: 'ALL', label: 'ALL (35)' },
                { key: 'CHANGE', label: '01 CHANGE (1)' },
                { key: 'PARM', label: '02 PARM (9)' },
                { key: 'ENGINE', label: '03 ENGINE (6)' },
                { key: 'TOTAL', label: '04 TOTAL (5)' },
                { key: 'FAULT', label: '05 FAULT (14)' }
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategoryFilter(cat.key)}
                  className={`btn btn-xs rounded-pill px-2.5 py-0.5 fs-12 transition-all ${selectedCategoryFilter === cat.key ? 'btn-cyan text-white shadow-sm' : 'dg-category-chip'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 5 CATEGORIES COLLAPSIBLE ACCORDION SHOWCASE MATRIX (MATCHING IMAGE 2) */}
            <div className="dg-params-container pe-1">
              {/* 01. CHANGE (1) */}
              {categorizedGroups['CHANGE'].length > 0 && (
                <div className="dg-category-block success mb-2.5">
                  <div 
                    onClick={() => toggleCategoryCollapse('CHANGE')}
                    className="dg-category-header success cursor-pointer d-flex align-items-center justify-content-between p-2.5"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="dg-code-pill success">01</span>
                      <Zap size={14} className="text-success" />
                      <span className="fs-12 fw-extrabold text-success uppercase tracking-wider">CHANGE</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge dg-cat-badge success rounded-pill px-2.5 py-1">
                        {categorizedGroups['CHANGE'].length} Parameter
                      </span>
                      {collapsedCategories['CHANGE'] ? <ChevronDown size={14} className="text-success" /> : <ChevronUp size={14} className="text-success" />}
                    </div>
                  </div>

                  {!collapsedCategories['CHANGE'] && (
                    <div className="p-2 pt-1">
                      <Row className="g-1.5">
                        {categorizedGroups['CHANGE'].map(p => {
                          const IconComp = p.icon || Zap;
                          return (
                            <Col key={p.id} md={12}>
                              <div className={`dg-param-tile-v2 ${p.isMapped ? 'success' : 'unmapped'}`}>
                                <div className="d-flex align-items-center gap-2 text-truncate">
                                  <span className="dg-param-num">{p.num}</span>
                                  <IconComp size={13} className={p.isMapped ? "text-success flex-shrink-0" : "text-muted opacity-50 flex-shrink-0"} />
                                  <span className="dg-param-name text-truncate">{p.name}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`dg-param-val ${p.isMapped ? 'green' : 'text-muted'}`}>{p.liveVal}</span>
                                  <ChevronRight size={13} className="opacity-40" />
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </div>
              )}

              {/* 02. PARM (9) */}
              {categorizedGroups['PARM'].length > 0 && (
                <div className="dg-category-block warning mb-2.5">
                  <div 
                    onClick={() => toggleCategoryCollapse('PARM')}
                    className="dg-category-header warning cursor-pointer d-flex align-items-center justify-content-between p-2.5"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="dg-code-pill warning">02</span>
                      <Settings size={14} className="text-warning" />
                      <span className="fs-12 fw-extrabold text-warning uppercase tracking-wider">PARM</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge dg-cat-badge warning rounded-pill px-2.5 py-1">
                        {categorizedGroups['PARM'].length} Parameters
                      </span>
                      {collapsedCategories['PARM'] ? <ChevronDown size={14} className="text-warning" /> : <ChevronUp size={14} className="text-warning" />}
                    </div>
                  </div>

                  {!collapsedCategories['PARM'] && (
                    <div className="p-2 pt-1">
                      <Row className="g-1.5">
                        {categorizedGroups['PARM'].map(p => {
                          const IconComp = p.icon || Settings;
                          return (
                            <Col key={p.id} md={6}>
                              <div className={`dg-param-tile-v2 ${p.isMapped ? 'warning' : 'unmapped'}`}>
                                <div className="d-flex align-items-center gap-2 text-truncate">
                                  <span className="dg-param-num">{p.num}</span>
                                  <IconComp size={13} className={p.isMapped ? "text-warning flex-shrink-0" : "text-muted opacity-50 flex-shrink-0"} />
                                  <span className="dg-param-name text-truncate">{p.name}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`dg-param-val ${p.isMapped ? 'warning' : 'text-muted'}`}>{p.liveVal}</span>
                                  <ChevronRight size={13} className="opacity-40" />
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </div>
              )}

              {/* 03. ENGINE (6) */}
              {categorizedGroups['ENGINE'].length > 0 && (
                <div className="dg-category-block info mb-2.5">
                  <div 
                    onClick={() => toggleCategoryCollapse('ENGINE')}
                    className="dg-category-header info cursor-pointer d-flex align-items-center justify-content-between p-2.5"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="dg-code-pill info">03</span>
                      <Cpu size={14} className="text-info" />
                      <span className="fs-12 fw-extrabold text-info uppercase tracking-wider">ENGINE</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge dg-cat-badge info rounded-pill px-2.5 py-1">
                        {categorizedGroups['ENGINE'].length} Parameters
                      </span>
                      {collapsedCategories['ENGINE'] ? <ChevronDown size={14} className="text-info" /> : <ChevronUp size={14} className="text-info" />}
                    </div>
                  </div>

                  {!collapsedCategories['ENGINE'] && (
                    <div className="p-2 pt-1">
                      <Row className="g-1.5">
                        {categorizedGroups['ENGINE'].map(p => {
                          const IconComp = p.icon || Cpu;
                          return (
                            <Col key={p.id} md={6}>
                              <div className={`dg-param-tile-v2 ${p.isMapped ? 'info' : 'unmapped'}`}>
                                <div className="d-flex align-items-center gap-2 text-truncate">
                                  <span className="dg-param-num">{p.num}</span>
                                  <IconComp size={13} className={p.isMapped ? "text-info flex-shrink-0" : "text-muted opacity-50 flex-shrink-0"} />
                                  <span className="dg-param-name text-truncate">{p.name}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`dg-param-val ${p.isMapped ? 'info' : 'text-muted'}`}>{p.liveVal}</span>
                                  <ChevronRight size={13} className="opacity-40" />
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </div>
              )}

              {/* 04. TOTAL (5) */}
              {categorizedGroups['TOTAL'].length > 0 && (
                <div className="dg-category-block purple mb-2.5">
                  <div 
                    onClick={() => toggleCategoryCollapse('TOTAL')}
                    className="dg-category-header purple cursor-pointer d-flex align-items-center justify-content-between p-2.5"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="dg-code-pill purple">04</span>
                      <TrendingDown size={14} className="text-purple-glow" />
                      <span className="fs-12 fw-extrabold text-purple-glow uppercase tracking-wider">TOTAL</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge dg-cat-badge purple rounded-pill px-2.5 py-1">
                        {categorizedGroups['TOTAL'].length} Parameters
                      </span>
                      {collapsedCategories['TOTAL'] ? <ChevronDown size={14} style={{ color: '#a855f7' }} /> : <ChevronUp size={14} style={{ color: '#a855f7' }} />}
                    </div>
                  </div>

                  {!collapsedCategories['TOTAL'] && (
                    <div className="p-2 pt-1">
                      <Row className="g-1.5">
                        {categorizedGroups['TOTAL'].map(p => {
                          const IconComp = p.icon || TrendingDown;
                          return (
                            <Col key={p.id} md={6}>
                              <div className={`dg-param-tile-v2 ${p.isMapped ? 'cyan' : 'unmapped'}`}>
                                <div className="d-flex align-items-center gap-2 text-truncate">
                                  <span className="dg-param-num">{p.num}</span>
                                  <IconComp size={13} className={p.isMapped ? "text-cyan-glow flex-shrink-0" : "text-muted opacity-50 flex-shrink-0"} />
                                  <span className="dg-param-name text-truncate">{p.name}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`dg-param-val ${p.isMapped ? 'green' : 'text-muted'}`}>{p.liveVal}</span>
                                  <ChevronRight size={13} className="opacity-40" />
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </div>
              )}

              {/* 05. FAULT (14) */}
              {categorizedGroups['FAULT'].length > 0 && (
                <div className="dg-category-block danger mb-2">
                  <div 
                    onClick={() => toggleCategoryCollapse('FAULT')}
                    className="dg-category-header danger cursor-pointer d-flex align-items-center justify-content-between p-2.5"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="dg-code-pill danger">05</span>
                      <ShieldAlert size={14} className="text-danger" />
                      <span className="fs-12 fw-extrabold text-danger uppercase tracking-wider">FAULT</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge dg-cat-badge danger rounded-pill px-2.5 py-1">
                        {categorizedGroups['FAULT'].length} Parameters
                      </span>
                      {collapsedCategories['FAULT'] ? <ChevronDown size={14} className="text-danger" /> : <ChevronUp size={14} className="text-danger" />}
                    </div>
                  </div>

                  {!collapsedCategories['FAULT'] && (
                    <div className="p-2 pt-1">
                      <Row className="g-1.5">
                        {categorizedGroups['FAULT'].map(p => {
                          const IconComp = p.icon || ShieldAlert;
                          return (
                            <Col key={p.id} md={6}>
                              <div className={`dg-param-tile-v2 ${p.isMapped ? 'danger' : 'unmapped'}`}>
                                <div className="d-flex align-items-center gap-2 text-truncate">
                                  <span className="dg-param-num">{p.num}</span>
                                  <IconComp size={13} className={p.isMapped ? "text-danger flex-shrink-0" : "text-muted opacity-50 flex-shrink-0"} />
                                  <span className="dg-param-name text-truncate">{p.name}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`dg-param-val ${p.isMapped ? (p.liveVal === '--' ? 'cyan' : 'red') : 'text-muted'}`}>
                                    {p.liveVal}
                                  </span>
                                  <ChevronRight size={13} className="opacity-40" />
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Col>

        {/* RIGHT COLUMN: LIVE ELECTRICAL OVERVIEW, QUICK ACTIONS & SYSTEM INFO */}
        <Col xl={3} lg={12}>
          <div className="d-flex flex-column gap-2.5">
            {/* LIVE ELECTRICAL OVERVIEW - MATCHING SCREENSHOT DESIGN */}
            <div className="dg-glass-card p-3">
              <div className="d-flex align-items-center justify-content-between mb-2.5">
                <div className="fw-bold fs-12 text-cyan-glow uppercase tracking-wider d-flex align-items-center gap-2">
                  <Zap size={15} /> LIVE ELECTRICAL OVERVIEW
                </div>
                <div className="dg-target-badge">
                  <Activity size={11} className={`text-success ${isDeviceConfigured ? 'pulse-icon' : 'opacity-50'} me-1`} />
                  <span className="text-dim">Target:</span>
                  <span className="text-main fw-bold ms-1">{isDeviceConfigured ? activeDeviceDisplayName : '--'}</span>
                </div>
              </div>

              <Row className="g-2">
                {/* kW Active Power */}
                <Col xs={4}>
                  <div className="dg-power-card-v2 cyan">
                    <div className="d-flex align-items-center gap-1.5 mb-2">
                      <div className="dg-power-icon-box cyan">
                        <Zap size={13} />
                      </div>
                      <div className="text-truncate">
                        <div className="dg-power-title">kW</div>
                        <div className="dg-power-sub">ACTIVE POWER</div>
                      </div>
                    </div>

                    <div className="d-flex align-items-end justify-content-between mt-2">
                      <div className="dg-power-val cyan">{isDeviceConfigured && data.power.kw !== null ? data.power.kw.toFixed(1) : '--'}</div>
                      <div className="dg-power-unit cyan">kW</div>
                    </div>
                  </div>
                </Col>

                {/* kVA Apparent Power */}
                <Col xs={4}>
                  <div className="dg-power-card-v2 warning">
                    <div className="d-flex align-items-center gap-1.5 mb-2">
                      <div className="dg-power-icon-box warning">
                        <Activity size={13} />
                      </div>
                      <div className="text-truncate">
                        <div className="dg-power-title warning">kVA</div>
                        <div className="dg-power-sub">APPARENT POWER</div>
                      </div>
                    </div>

                    <div className="d-flex align-items-end justify-content-between mt-2">
                      <div className="dg-power-val warning">{isDeviceConfigured && data.power.kva !== null ? data.power.kva.toFixed(1) : '--'}</div>
                      <div className="dg-power-unit warning">kVA</div>
                    </div>
                  </div>
                </Col>

                {/* kVAr Reactive Power */}
                <Col xs={4}>
                  <div className="dg-power-card-v2 success">
                    <div className="d-flex align-items-center gap-1.5 mb-2">
                      <div className="dg-power-icon-box success">
                        <TrendingDown size={13} />
                      </div>
                      <div className="text-truncate">
                        <div className="dg-power-title success">kVAr</div>
                        <div className="dg-power-sub">REACTIVE POWER</div>
                      </div>
                    </div>

                    <div className="d-flex align-items-end justify-content-between mt-2">
                      <div className="dg-power-val success">{isDeviceConfigured && data.power.kvar !== null ? data.power.kvar.toFixed(1) : '--'}</div>
                      <div className="dg-power-unit success">kVAr</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* QUICK ACTIONS SECTION WITH REAL PILL TOGGLE SWITCH (MATCHING IMAGE 1) */}
            <div className="dg-glass-card p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="fw-bold fs-12 text-cyan-glow uppercase tracking-wider d-flex align-items-center gap-2">
                  <Settings size={15} /> QUICK ACTIONS
                </div>

                {/* REAL SLIDING PILL TOGGLE SWITCH (OFF/ON) */}
                <div 
                  onClick={() => setShowQuickActions(!showQuickActions)} 
                  className={`dg-pill-toggle-switch ${showQuickActions ? 'on' : 'off'}`}
                  title={showQuickActions ? "Click to Turn OFF Controls" : "Click to Turn ON Controls"}
                >
                  <span className="dg-toggle-label">{showQuickActions ? 'ON' : 'OFF'}</span>
                  <div className="dg-toggle-knob"></div>
                </div>
              </div>

              {showQuickActions && (
                <div className="mt-2.5 pt-2 border-top border-white border-opacity-10 transition-all">
                  <Row className="g-2">
                    <Col xs={6}>
                      <button onClick={handleStartEngine} disabled={!isDeviceConfigured} className="dg-action-btn-v2 start w-100 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div className="dg-action-icon-circle start"><Play size={12} fill="currentColor" /></div>
                          <span>START</span>
                        </div>
                        <ChevronRight size={14} className="opacity-70" />
                      </button>
                    </Col>
                    <Col xs={6}>
                      <button onClick={handleStopEngine} disabled={!isDeviceConfigured} className="dg-action-btn-v2 stop w-100 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div className="dg-action-icon-circle stop"><Square size={12} fill="currentColor" /></div>
                          <span>STOP</span>
                        </div>
                        <ChevronRight size={14} className="opacity-70" />
                      </button>
                    </Col>
                    <Col xs={6}>
                      <button onClick={handleResetEngine} disabled={!isDeviceConfigured} className="dg-action-btn-v2 reset w-100 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div className="dg-action-icon-circle reset"><RotateCcw size={12} /></div>
                          <span>RESET</span>
                        </div>
                        <ChevronRight size={14} className="opacity-70" />
                      </button>
                    </Col>
                    <Col xs={6}>
                      <button onClick={handleEmergencyStop} disabled={!isDeviceConfigured} className="dg-action-btn-v2 emergency w-100 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div className="dg-action-icon-circle emergency"><AlertOctagon size={12} /></div>
                          <span>EMERGENCY</span>
                        </div>
                        <ChevronRight size={14} className="opacity-70" />
                      </button>
                    </Col>
                  </Row>
                </div>
              )}
            </div>

            {/* SYSTEM INFO WITH SLEEK ICON PILL ROWS */}
            <div className="dg-glass-card p-3">
              <div className="fw-bold fs-12 text-cyan-glow mb-2.5 uppercase tracking-wider d-flex align-items-center gap-2">
                <Info size={15} /> SYSTEM INFO
              </div>

              <div className="d-flex flex-column gap-1.5">
                <div className="dg-sysinfo-row">
                  <div className="d-flex align-items-center gap-2">
                    <Tag size={13} className="text-cyan-glow" />
                    <span className="text-dim fs-12 fw-medium">Generator ID</span>
                  </div>
                  <span className="text-main fs-12 font-monospace fw-bold">{isDeviceConfigured ? (selectedDevObj?.name || selectedDevObj?.deviceName || `DEV-${selectedDeviceId}`) : '--'}</span>
                </div>

                <div className="dg-sysinfo-row">
                  <div className="d-flex align-items-center gap-2">
                    <Database size={13} className="text-info" />
                    <span className="text-dim fs-12 fw-medium">Capacity</span>
                  </div>
                  <span className="text-main fs-12 font-monospace fw-bold">{isDeviceConfigured ? (selectedDevObj?.capacity || selectedDevObj?.template?.capacity || '500 kVA') : '--'}</span>
                </div>

                <div className="dg-sysinfo-row">
                  <div className="d-flex align-items-center gap-2">
                    <Fuel size={13} className="text-warning" />
                    <span className="text-dim fs-12 fw-medium">Fuel Type</span>
                  </div>
                  <span className="text-main fs-12 fw-bold">{isDeviceConfigured ? (selectedDevObj?.fuelType || selectedDevObj?.template?.fuelType || 'Diesel') : '--'}</span>
                </div>

                <div className="dg-sysinfo-row">
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={13} className="text-danger" />
                    <span className="text-dim fs-12 fw-medium">Location</span>
                  </div>
                  <span className="text-main fs-12 fw-bold">{selectedSiteObj?.name || (selectedSiteId ? `Site #${selectedSiteId}` : '--')}</span>
                </div>

                <div className="dg-sysinfo-row">
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={13} className="text-success" />
                    <span className="text-dim fs-12 fw-medium">Last Updated</span>
                  </div>
                  <span className="text-main fs-12 font-monospace fw-bold">{isDeviceConfigured ? currentTime : '--'}</span>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* PDF OVERLAY */}
      {generatingPdf && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-80 d-flex flex-column align-items-center justify-content-center" style={{ zIndex: 9999, backdropFilter: 'blur(10px)' }}>
          <div className="spinner-border text-info mb-4" style={{ width: '3rem', height: '3rem' }}></div>
          <h5 className="text-white fw-bold uppercase tracking-wider">Synchronizing SCADA Logs...</h5>
        </div>
      )}

      {/* SUCCESS TOAST */}
      <ToastContainer position="bottom-end" className="p-4">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide className="bg-dark border border-info border-opacity-20 shadow-2xl">
          <Toast.Body className="text-white fs-12 p-3 d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-20 p-2 rounded-circle"><FileDown size={18} className="text-success" /></div>
            <div>
              <div className="fw-bold text-info uppercase">Export Complete</div>
              <small className="text-muted">DG_SET_35_PARAMETERS.pdf</small>
            </div>
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* ULTRA-PREMIUM LIGHT & DARK THEME GLASSMORPHISM CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* DARK THEME SYSTEM (DEFAULT) */
        .dg-premium-page {
          background: #030712;
          background-image: 
            radial-gradient(ellipse at 50% 0%, rgba(14, 165, 233, 0.08) 0%, transparent 60%),
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 100% 100%, 30px 30px, 30px 30px;
          color: #f8fafc;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .dg-glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }
        .dg-glass-card:hover { border-color: rgba(14, 165, 233, 0.25); }

        .text-main { color: #f8fafc; }
        .text-dim { color: #94a3b8; }
        .bg-pill-status { background: rgba(3, 7, 18, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); }
        .dg-opt { background: #0f172a; color: #f8fafc; }

        /* LIGHT MODE HIGH-CONTRAST PREMIUM SYSTEM */
        body.light-mode .dg-premium-page,
        [data-theme="light"] .dg-premium-page {
          background: #f1f5f9 !important;
          background-image: 
            radial-gradient(ellipse at 50% 0%, rgba(2, 132, 199, 0.08) 0%, transparent 60%),
            linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px) !important;
          background-size: 100% 100%, 30px 30px, 30px 30px !important;
          color: #0f172a !important;
        }

        body.light-mode .dg-glass-card,
        [data-theme="light"] .dg-glass-card {
          background: rgba(255, 255, 255, 0.85) !important;
          border: 1px solid rgba(203, 213, 225, 0.8) !important;
          box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.08) !important;
        }

        body.light-mode .text-main,
        [data-theme="light"] .text-main { color: #0f172a !important; }

        body.light-mode .text-dim,
        [data-theme="light"] .text-dim { color: #64748b !important; }

        body.light-mode .bg-pill-status,
        [data-theme="light"] .bg-pill-status {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
        }

        body.light-mode .dg-opt,
        [data-theme="light"] .dg-opt { background: #ffffff !important; color: #0f172a !important; }

        /* REALISTIC FLUID DIESEL FUEL TANK WITH WAVE & BUBBLE ANIMATIONS */
        .dg-realistic-fuel-tank {
          width: 110px;
          height: 165px;
          background: rgba(15, 23, 42, 0.4);
          border: 2px solid rgba(245, 158, 11, 0.45);
          border-radius: 18px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 0 15px rgba(245, 158, 11, 0.15);
        }
        
        .dg-tank-sheen {
          position: absolute;
          top: 0;
          left: 6px;
          width: 12px;
          height: 100%;
          background: linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
          z-index: 6;
          pointer-events: none;
        }

        .dg-tank-ticks {
          position: absolute;
          right: 5px;
          top: 10px;
          bottom: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 0.52rem;
          font-family: monospace;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          z-index: 8;
          pointer-events: none;
          text-shadow: 0 1px 3px rgba(0,0,0,0.9);
        }

        .dg-fluid-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(to top, #b45309 0%, #d97706 40%, #f59e0b 80%, #fbbf24 100%);
          transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
        }

        .dg-fluid-surface-glow {
          position: absolute;
          top: -2px;
          left: 0;
          width: 100%;
          height: 4px;
          background: rgba(254, 240, 138, 0.9);
          box-shadow: 0 0 10px #fbbf24, 0 0 20px #f59e0b;
          z-index: 4;
        }

        /* BUBBLES IN LIQUID */
        .dg-bubble {
          position: absolute;
          bottom: -10px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: floatBubble 4s infinite ease-in;
          pointer-events: none;
          z-index: 3;
        }
        .dg-bubble.b1 { left: 20%; width: 5px; height: 5px; animation-duration: 3.2s; animation-delay: 0.5s; }
        .dg-bubble.b2 { left: 55%; width: 7px; height: 7px; animation-duration: 4.5s; animation-delay: 1.2s; }
        .dg-bubble.b3 { left: 80%; width: 4px; height: 4px; animation-duration: 3.8s; animation-delay: 2.1s; }

        @keyframes floatBubble {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-140px) scale(1.3); opacity: 0; }
        }

        @keyframes waveMoveBack {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes waveMoveFront {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .dg-fluid-wave {
          position: absolute;
          top: -12px;
          left: 0;
          width: 200%;
          height: 22px;
          z-index: 5;
        }
        .dg-fluid-wave.wave-back {
          fill: rgba(254, 240, 138, 0.45);
          animation: waveMoveBack 5s linear infinite;
        }
        .dg-fluid-wave.wave-front {
          fill: rgba(245, 158, 11, 0.75);
          animation: waveMoveFront 3s linear infinite;
        }

        .dg-tank-center-badge {
          position: absolute;
          top: 45%;
          left: 45%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
          background: transparent;
          border: none;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          pointer-events: none;
        }
        .dg-tank-val {
          font-family: monospace;
          font-size: 1.35rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.9);
        }
        .dg-tank-lbl {
          font-size: 0.62rem;
          font-weight: 800;
          color: #fbbf24;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.9);
        }

        /* ELEGANT FUEL METRIC TILES */
        .dg-fuel-tile {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.25s ease;
        }
        .dg-fuel-tile:hover {
          transform: translateX(4px);
          background: rgba(15, 23, 42, 0.8);
        }
        .dg-fuel-tile.warning { border-left: 4px solid #f59e0b; }
        .dg-fuel-tile.danger { border-left: 4px solid #ef4444; }
        .dg-fuel-tile.info { border-left: 4px solid #06b6d4; }

        .dg-fuel-tile-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dg-fuel-tile-icon.warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .dg-fuel-tile-icon.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .dg-fuel-tile-icon.info { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }

        .dg-fuel-tile-lbl {
          font-size: 0.78rem;
          font-weight: 600;
          color: #94a3b8;
        }
        .dg-fuel-tile-val {
          font-family: monospace;
          font-size: 0.95rem;
          font-weight: 800;
        }
        .dg-fuel-tile-val.warning { color: #fbbf24; }
        .dg-fuel-tile-val.danger { color: #f87171; }
        .dg-fuel-tile-val.info { color: #38bdf8; }

        body.light-mode .dg-fuel-tile, [data-theme="light"] .dg-fuel-tile {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 2px 5px rgba(0,0,0,0.04);
        }
        body.light-mode .dg-fuel-tile-lbl, [data-theme="light"] .dg-fuel-tile-lbl {
          color: #475569 !important;
        }
        body.light-mode .dg-realistic-fuel-tank, [data-theme="light"] .dg-realistic-fuel-tank {
          background: #f8fafc !important;
          border-color: #f59e0b !important;
        }

        /* COMPACT PARAM TILES WITH UNMAPPED GRAYOUT */
        .dg-param-tile-v2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 9px;
          min-height: 29px;
          border-radius: 8px;
          background: rgba(3, 7, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }
        .dg-param-tile-v2.success { border-left: 3px solid #10b981; }
        .dg-param-tile-v2.warning { border-left: 3px solid #f59e0b; }
        .dg-param-tile-v2.info { border-left: 3px solid #0284c7; }
        .dg-param-tile-v2.cyan { border-left: 3px solid #06b6d4; }
        .dg-param-tile-v2.danger { border-left: 3px solid #ef4444; }

        .dg-param-tile-v2.unmapped {
          opacity: 0.38 !important;
          filter: grayscale(85%) !important;
          background: rgba(15, 23, 42, 0.25) !important;
          border: 1px dashed rgba(255, 255, 255, 0.1) !important;
          border-left: 1px dashed rgba(255, 255, 255, 0.1) !important;
        }
        .dg-param-tile-v2.unmapped .dg-param-name {
          color: #64748b !important;
        }
        .dg-param-tile-v2.unmapped .dg-param-val {
          color: #475569 !important;
          font-weight: 500 !important;
        }

        body.light-mode .dg-param-tile-v2.unmapped,
        [data-theme="light"] .dg-param-tile-v2.unmapped {
          background: #e2e8f0 !important;
          border: 1px dashed #cbd5e1 !important;
          opacity: 0.45 !important;
        }

        .dg-param-num {
          font-size: 0.65rem;
          font-family: monospace;
          color: #64748b;
          background: rgba(255, 255, 255, 0.06);
          padding: 1px 5px;
          border-radius: 4px;
        }
        .dg-param-name {
          font-size: 0.74rem;
          font-weight: 500;
          color: #e2e8f0;
        }
        body.light-mode .dg-param-name,
        [data-theme="light"] .dg-param-name { color: #0f172a !important; }

        .dg-param-val {
          font-size: 0.74rem;
          font-weight: 700;
          font-family: monospace;
        }
        .dg-param-val.cyan { color: #0284c7; }
        .dg-param-val.warning { color: #d97706; }
        .dg-param-val.info { color: #0284c7; }
        .dg-param-val.green { color: #059669; }
        .dg-param-val.red { color: #dc2626; background: rgba(239, 68, 68, 0.15); padding: 1px 6px; border-radius: 4px; }

        /* HYPER-REALISTIC MECHANICAL ENGINE RUNNING EFFECTS */
        .dg-hero-img { transition: transform 0.5s ease; }
        .dg-hero-img.dg-mechanical-vibe {
          animation: dg-real-engine-hum 0.12s linear infinite;
          will-change: transform;
        }

        @keyframes dg-real-engine-hum {
          0% { transform: translate(0, 0) scale(1.002); }
          25% { transform: translate(0.4px, -0.4px) scale(1.002); }
          50% { transform: translate(-0.4px, 0.3px) scale(1.002); }
          75% { transform: translate(0.3px, 0.4px) scale(1.002); }
          100% { transform: translate(0, 0) scale(1.002); }
        }

        .dg-generator-hero-frame.engine-active {
          border-color: rgba(16, 185, 129, 0.4) !important;
          box-shadow: 0 0 35px rgba(16, 185, 129, 0.25), inset 0 0 20px rgba(16, 185, 129, 0.1) !important;
        }

        .dg-generator-hero-frame.engine-idle {
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        /* EXHAUST HEAT SHIMMER & THERMAL HAZE LAYER */
        .dg-exhaust-thermal-haze {
          position: absolute;
          top: 0;
          left: 20%;
          width: 60%;
          height: 45%;
          pointer-events: none;
          overflow: hidden;
          z-index: 5;
        }

        .dg-heat-wave {
          position: absolute;
          top: 10px;
          left: 35%;
          width: 70px;
          height: 100px;
          background: radial-gradient(ellipse at bottom, rgba(255, 255, 255, 0.12) 0%, rgba(255, 200, 100, 0.05) 40%, transparent 80%);
          filter: blur(4px);
          border-radius: 50%;
          animation: dg-heat-rise 2s ease-in-out infinite;
        }
        .dg-heat-wave.w2 { left: 45%; animation-delay: 0.6s; animation-duration: 2.3s; }
        .dg-heat-wave.w3 { left: 25%; animation-delay: 1.2s; animation-duration: 1.8s; }

        @keyframes dg-heat-rise {
          0% { transform: translateY(30px) scaleX(0.8); opacity: 0; }
          30% { opacity: 0.5; }
          70% { opacity: 0.3; }
          100% { transform: translateY(-40px) scaleX(1.4); opacity: 0; }
        }

        .dg-exhaust-smoke-puff {
          position: absolute;
          top: 5px;
          left: 40%;
          width: 14px;
          height: 14px;
          background: rgba(255, 255, 255, 0.18);
          border-radius: 50%;
          filter: blur(3px);
          animation: dg-smoke-rise 2.5s ease-out infinite;
        }
        .dg-exhaust-smoke-puff.p2 { left: 43%; animation-delay: 1.2s; }

        @keyframes dg-smoke-rise {
          0% { transform: translateY(20px) scale(0.6); opacity: 0.4; }
          100% { transform: translateY(-50px) scale(3.5); opacity: 0; }
        }

        /* FLOATING ENGINE STATUS PILL */
        .dg-engine-status-floating-pill {
          position: absolute;
          bottom: 12px;
          left: 12px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          font-size: 0.72rem;
          font-weight: 800;
          font-family: monospace;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }

        .dg-engine-status-floating-pill.running {
          background: rgba(6, 78, 59, 0.85);
          border: 1px solid rgba(52, 211, 153, 0.5);
          color: #34d399;
        }

        .dg-engine-status-floating-pill.idle {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
        }

        .dg-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .dg-live-dot.green-pulse {
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: dg-pulse-dot 1.2s infinite;
        }
        .dg-live-dot.gray { background: #64748b; }

        @keyframes dg-pulse-dot {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }

        /* SOUNDWAVE ANIMATED BARS */
        .dg-soundwave-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 12px;
        }
        .dg-soundwave-bars .bar {
          width: 2.5px;
          background: #34d399;
          border-radius: 2px;
          animation: dg-wave-bar 0.8s ease-in-out infinite alternate;
        }
        .dg-soundwave-bars .bar.b1 { height: 40%; animation-delay: 0.1s; }
        .dg-soundwave-bars .bar.b2 { height: 90%; animation-delay: 0.3s; }
        .dg-soundwave-bars .bar.b3 { height: 60%; animation-delay: 0.2s; }
        .dg-soundwave-bars .bar.b4 { height: 100%; animation-delay: 0.4s; }

        @keyframes dg-wave-bar {
          0% { height: 20%; }
          100% { height: 100%; }
        }
        .dg-chip-val { font-size: 0.8rem; color: #fff; font-weight: 800; font-family: monospace; }
        .dg-chip-val.cyan { color: #38bdf8; }
        .dg-chip-val.warning { color: #fbbf24; }

        .dg-brand-badge {
          display: flex;
          align-items: center;
          background: rgba(14, 165, 233, 0.1);
          border: 1px solid rgba(14, 165, 233, 0.25);
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
        }

        .dg-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .dg-status-dot.green { background: #10b981; box-shadow: 0 0 8px #10b981; }

        .dg-btn-outline-glass {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          font-size: 0.78rem;
          font-weight: 600;
          border-radius: 8px;
          padding: 6px 14px;
          transition: 0.25s;
        }

        .dg-btn-cyan {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: #fff;
          border: none;
          font-size: 0.78rem;
          font-weight: 600;
          border-radius: 8px;
          padding: 6px 14px;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
          transition: 0.25s;
        }

        /* 3-TIER ULTRA-PREMIUM SELECTORS */
        .dg-selector-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
          padding: 6px 14px;
          border-radius: 12px;
          border: 1px solid rgba(14, 165, 233, 0.3);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          transition: all 0.25s ease;
        }
        .dg-selector-box:hover {
          border-color: rgba(14, 165, 233, 0.6);
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.25);
        }
        body.light-mode .dg-selector-box,
        [data-theme="light"] .dg-selector-box { 
          background: linear-gradient(135deg, #ffffff, #f8fafc) !important; 
          border-color: #cbd5e1 !important; 
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .dg-selector-box:hover,
        [data-theme="light"] .dg-selector-box:hover {
          border-color: #0284c7 !important;
          box-shadow: 0 4px 15px rgba(2, 132, 199, 0.15) !important;
        }

        .dg-selector-box.warning { border-color: rgba(245, 158, 11, 0.3); }
        .dg-selector-box.warning:hover { border-color: rgba(245, 158, 11, 0.6); box-shadow: 0 4px 20px rgba(245, 158, 11, 0.25); }

        .dg-selector-box.success { border-color: rgba(16, 185, 129, 0.3); }
        .dg-selector-box.success:hover { border-color: rgba(16, 185, 129, 0.6); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25); }
        
        .dg-custom-select {
          background: transparent !important;
          border: none !important;
          color: #f8fafc !important;
          font-size: 0.82rem !important;
          font-weight: 700 !important;
          padding: 2px 24px 2px 0 !important;
          min-width: 175px;
          cursor: pointer;
          outline: none !important;
          box-shadow: none !important;
        }
        body.light-mode .dg-custom-select,
        [data-theme="light"] .dg-custom-select { color: #0f172a !important; }

        .dg-custom-select.warning { color: #fbbf24 !important; }
        body.light-mode .dg-custom-select.warning,
        [data-theme="light"] .dg-custom-select.warning { color: #d97706 !important; }

        .dg-custom-select.success { color: #34d399 !important; }
        body.light-mode .dg-custom-select.success,
        [data-theme="light"] .dg-custom-select.success { color: #059669 !important; }

        .text-cyan-glow { color: #0284c7; }
        .text-warning-glow { color: #d97706; }
        .text-success-glow { color: #059669; }
        .bg-gradient-overlay { background: linear-gradient(to top, rgba(3, 7, 18, 0.95) 0%, transparent 100%); }

        /* METRIC ROWS */
        .dg-metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          border-radius: 8px;
          background: rgba(3, 7, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        body.light-mode .dg-metric-row,
        [data-theme="light"] .dg-metric-row {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }

        /* SEARCH GROUP */
        .dg-search-group {
          background: rgba(3, 7, 18, 0.6);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        body.light-mode .dg-search-group,
        [data-theme="light"] .dg-search-group { background: #ffffff !important; border-color: #cbd5e1 !important; }

        /* CATEGORY CHIPS */
        .dg-category-chip {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          font-size: 0.72rem;
          font-weight: 600;
        }
        body.light-mode .dg-category-chip,
        [data-theme="light"] .dg-category-chip { background: #ffffff !important; border-color: #cbd5e1 !important; color: #475569 !important; }

        .dg-code-pill {
          padding: 1px 7px;
          border-radius: 5px;
          font-size: 0.68rem;
          font-weight: 700;
          font-family: monospace;
        }
        .dg-code-pill.success { background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); }
        .dg-code-pill.warning { background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); }
        .dg-code-pill.info { background: rgba(14, 165, 233, 0.15); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.3); }
        .dg-code-pill.cyan { background: rgba(6, 182, 212, 0.15); color: #0891b2; border: 1px solid rgba(6, 182, 212, 0.3); }
        .dg-code-pill.danger { background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }

        /* POWER CARDS V2 MATCHING SCREENSHOT */
        .dg-power-card-v2 {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(14, 165, 233, 0.3);
          border-radius: 12px;
          padding: 9px 10px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
          transition: all 0.25s ease;
        }
        .dg-power-card-v2.cyan { border-color: rgba(14, 165, 233, 0.4); }
        .dg-power-card-v2.warning { border-color: rgba(245, 158, 11, 0.4); }
        .dg-power-card-v2.success { border-color: rgba(16, 185, 129, 0.4); }

        body.light-mode .dg-power-card-v2,
        [data-theme="light"] .dg-power-card-v2 {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04) !important;
        }

        .dg-power-icon-box {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dg-power-icon-box.cyan { background: rgba(14, 165, 233, 0.18); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.35); }
        .dg-power-icon-box.warning { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); }
        .dg-power-icon-box.success { background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); }

        .dg-power-title { font-size: 0.8rem; font-weight: 800; color: #fff; line-height: 1; }
        .dg-power-title.warning { color: #fff; }
        .dg-power-title.success { color: #fff; }
        body.light-mode .dg-power-title,
        [data-theme="light"] .dg-power-title { color: #0f172a !important; }

        .dg-power-sub { font-size: 0.52rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.4px; }
        body.light-mode .dg-power-sub,
        [data-theme="light"] .dg-power-sub { color: #64748b !important; }

        .dg-sparkline-wrap { height: 26px; margin: 2px 0; }

        .dg-power-val { font-size: 1.15rem; font-weight: 900; font-family: monospace; line-height: 1; }
        .dg-power-val.cyan { color: #38bdf8; }
        .dg-power-val.warning { color: #fbbf24; }
        .dg-power-val.success { color: #34d399; }
        body.light-mode .dg-power-val.cyan, [data-theme="light"] .dg-power-val.cyan { color: #0284c7 !important; }
        body.light-mode .dg-power-val.warning, [data-theme="light"] .dg-power-val.warning { color: #d97706 !important; }
        body.light-mode .dg-power-val.success, [data-theme="light"] .dg-power-val.success { color: #059669 !important; }

        .dg-power-unit { font-size: 0.78rem; font-weight: 800; font-family: monospace; }
        .dg-power-unit.cyan { color: #38bdf8; }
        .dg-power-unit.warning { color: #fbbf24; }
        .dg-power-unit.success { color: #34d399; }
        body.light-mode .dg-power-unit.cyan, [data-theme="light"] .dg-power-unit.cyan { color: #0284c7 !important; }
        body.light-mode .dg-power-unit.warning, [data-theme="light"] .dg-power-unit.warning { color: #d97706 !important; }
        body.light-mode .dg-power-unit.success, [data-theme="light"] .dg-power-unit.success { color: #059669 !important; }

        /* TARGET BADGE */
        .dg-target-badge {
          background: rgba(3, 7, 18, 0.7);
          border: 1px solid rgba(14, 165, 233, 0.25);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 0.72rem;
        }
        body.light-mode .dg-target-badge, [data-theme="light"] .dg-target-badge {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }

        /* ACTION BUTTONS V2 */
        .dg-action-btn-v2 {
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 0.76rem;
          font-weight: 800;
          border: 1px solid transparent;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }
        .dg-action-btn-v2:hover { transform: translateY(-1px); }
        .dg-action-btn-v2.start {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
          border-color: rgba(52, 211, 153, 0.4);
        }
        .dg-action-btn-v2.stop {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
          border-color: rgba(248, 113, 113, 0.4);
        }
        .dg-action-btn-v2.reset {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: #ffffff;
          border-color: rgba(56, 189, 248, 0.4);
        }
        .dg-action-btn-v2.emergency {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #ffffff;
          border-color: rgba(251, 191, 36, 0.4);
        }

        .dg-action-icon-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.25);
        }

        /* SYSTEM INFO ROW */
        .dg-sysinfo-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(3, 7, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        body.light-mode .dg-sysinfo-row, [data-theme="light"] .dg-sysinfo-row {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        /* REAL SLIDING PILL TOGGLE SWITCH (MATCHING IMAGE 1) */
        .dg-pill-toggle-switch {
          width: 54px;
          height: 26px;
          border-radius: 14px;
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 3px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
          user-select: none;
        }
        .dg-pill-toggle-switch.off {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border: 1px solid rgba(239, 68, 68, 0.5);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .dg-pill-toggle-switch.on {
          background: linear-gradient(135deg, #10b981, #059669);
          border: 1px solid rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .dg-toggle-knob {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2;
        }
        .dg-pill-toggle-switch.on .dg-toggle-knob {
          transform: translateX(28px);
        }
        .dg-pill-toggle-switch.off .dg-toggle-knob {
          transform: translateX(0);
        }

        .dg-toggle-label {
          font-size: 0.65rem;
          font-weight: 900;
          color: #ffffff;
          position: absolute;
          font-family: monospace;
          letter-spacing: 0.5px;
          z-index: 1;
        }
        .dg-pill-toggle-switch.off .dg-toggle-label { right: 7px; }
        .dg-pill-toggle-switch.on .dg-toggle-label { left: 7px; }

        /* COLLAPSIBLE CATEGORY BLOCKS (MATCHING IMAGE 2) */
        .dg-category-block {
          border-radius: 12px;
          background: rgba(3, 7, 18, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          transition: all 0.25s ease;
        }
        .dg-category-block.success { border-color: rgba(16, 185, 129, 0.3); }
        .dg-category-block.warning { border-color: rgba(245, 158, 11, 0.3); }
        .dg-category-block.info { border-color: rgba(14, 165, 233, 0.3); }
        .dg-category-block.purple { border-color: rgba(168, 85, 247, 0.3); }
        .dg-category-block.danger { border-color: rgba(239, 68, 68, 0.3); }

        body.light-mode .dg-category-block,
        [data-theme="light"] .dg-category-block {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .dg-category-header {
          background: rgba(255, 255, 255, 0.02);
          user-select: none;
          transition: background 0.2s ease;
        }
        .dg-category-header:hover { background: rgba(255, 255, 255, 0.05); }
        .dg-category-header.success { background: rgba(16, 185, 129, 0.06); }
        .dg-category-header.warning { background: rgba(245, 158, 11, 0.06); }
        .dg-category-header.info { background: rgba(14, 165, 233, 0.06); }
        .dg-category-header.purple { background: rgba(168, 85, 247, 0.06); }
        .dg-category-header.danger { background: rgba(239, 68, 68, 0.06); }

        .text-purple-glow { color: #a855f7; }

        /* PARAM TILE V2 */
        .dg-param-tile-v2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.2s ease;
        }
        .dg-param-tile-v2:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.15);
        }
        body.light-mode .dg-param-tile-v2,
        [data-theme="light"] .dg-param-tile-v2 {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        .dg-code-pill.purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.3); }

        .dg-params-container {
          max-height: calc(100vh - 270px);
          overflow-y: auto;
          scroll-behavior: smooth;
        }
        .dg-params-container::-webkit-scrollbar {
          width: 5px;
        }
        .dg-params-container::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }

        .pulse-icon { animation: dg-pulse 2s infinite; }
        @keyframes dg-pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      `}} />
    </div>
  );
};

export default SiemensStyleDG;
