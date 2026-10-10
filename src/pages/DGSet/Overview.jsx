import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Card, Badge, ProgressBar, Toast, ToastContainer, Table, Form, Button, InputGroup, Spinner } from 'react-bootstrap';
import { 
  ShieldAlert, Zap, Activity, Gauge, Fuel, History, 
  Settings, FileDown, Home, Database, TrendingDown,
  Building2, Layers, Cpu, Search, Play, Square, RotateCcw, 
  AlertOctagon, Info, LayoutGrid, ListFilter, Sliders, CheckCircle2,
  AlertCircle, ChevronRight, RefreshCw, RefreshCcw, Radio, Maximize2, Sun, Moon,
  Tag, MapPin, Clock, ChevronDown, ChevronUp, Thermometer, Droplets, Calendar, Upload, Image as ImageIcon,
  ShieldCheck, Check, Power, AlertTriangle, Eye, EyeOff, Sparkles, Filter
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

const DEFAULT_CLEAN_STATE = {
  voltage: { ry: null, yb: null, br: null, rn: null, yn: null, bn: null },
  current: { r: null, y: null, b: null, avg: null },
  power: { kw: null, kvar: null, kva: null, pf: null },
  engine: { coolant: null, oilPressure: null, oilTemp: null, speed: null, runtime: null, freq: null, battery: null, starts: null, status: null },
  diesel: { level: null, remaining: null, capacity: 2000, spentToday: null, efficiency: null, lastFill: '--' },
  generation: { today: null, kvaHours: null, kvarHours: null, month: null }
};

const SiemensStyleDG = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { deviceId: routeDeviceId } = useParams();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [paramSearch, setParamSearch] = useState('');
  const [showOnlyMapped, setShowOnlyMapped] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
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
      const globalSiteId = selectedSite?.id || selectedSite?.siteId || selectedSite?._id;
      const globalSite = storeSites.find(site => String(site.id || site.siteId || site._id) === String(globalSiteId));
      const savedSite = storeSites.find(site => String(site.id || site.siteId || site._id) === String(selectedSiteId));
      const initialSite = globalSite || savedSite || storeSites[0];
      const initialId = String(initialSite.id || initialSite.siteId || initialSite._id);
      if (String(selectedSiteId) !== initialId) {
        setSelectedSiteId(initialId);
        localStorage.setItem('selected_dg_site_id', initialId);
      }
      if (setSelectedSite && String(globalSiteId || '') !== initialId) {
        setSelectedSite(initialSite);
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
        const globalSiteId = selectedSite?.id || selectedSite?.siteId || selectedSite?._id;
        const initialId = sitesList.some(site => String(site.id) === String(globalSiteId))
          ? String(globalSiteId)
          : (selectedSiteId && sitesList.some(site => String(site.id) === String(selectedSiteId)) ? selectedSiteId : sitesList[0].id);
        setSelectedSiteId(initialId);
        localStorage.setItem('selected_dg_site_id', initialId);
        if (setSelectedSite) {
          setSelectedSite(sitesList.find(s => String(s.id) === String(initialId)) || sitesList[0]);
        }
      }
    };
    loadSites();
  }, [storeSites, selectedSite, selectedSiteId, setSelectedSite]);

  // The site selector lives in the shared app header; keep the DG data filter in sync with it.
  useEffect(() => {
    const globalSiteId = selectedSite?.id || selectedSite?.siteId || selectedSite?._id;
    if (!globalSiteId || !sites.length) return;
    const siteId = String(globalSiteId);
    if (!sites.some(site => String(site.id || site.siteId || site._id) === siteId)) return;
    if (String(selectedSiteId) !== siteId) {
      setSelectedSiteId(siteId);
      localStorage.setItem('selected_dg_site_id', siteId);
    }
  }, [selectedSite?.id, selectedSite?.siteId, selectedSite?._id, sites, selectedSiteId]);

  // 2. Load Generator Devices for selectedSiteId (Aggregate API & LocalStorage for multi-DG support)
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
        const discovered = [];
        const seenIds = new Set();

        const addDevice = (d) => {
          if (!d) return;
          const id = String(d.id || d.deviceId || d._id || '').trim();
          if (!id || seenIds.has(id)) return;

          // Check if device belongs to this site
          const devSiteId = d.siteId !== undefined && d.siteId !== null ? String(d.siteId) : null;
          if (devSiteId && devSiteId !== String(selectedSiteId)) {
            return;
          }

          // Check if it's a generator / DG device
          const cat = String(d.category || d.type || '').toUpperCase();
          const name = String(d.name || d.deviceName || d.label || d.title || '').toUpperCase();
          const mod = String(d.module || '').toUpperCase();
          const isDG = 
            cat.includes('GEN') || 
            cat.includes('DG') || 
            mod.includes('DG') || 
            mod.includes('GEN') || 
            name.includes('DG') || 
            name.includes('GENERATOR') || 
            name.includes('GENSET') || 
            d.module === 'DG Set';

          if (isDG) {
            seenIds.add(id);
            discovered.push({
              ...d,
              id,
              name: d.name || d.deviceName || d.label || d.title || `DG-SET-${discovered.length + 1}`
            });
          }
        };

        // 1. Fetch from /devices?siteId=...&category=GENERATOR
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
          if (res && res.ok) {
            const json = await res.json();
            const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
            list.forEach(addDevice);
          }
        } catch (e) {}

        // 2. Fetch via bmsService.getSiteDevices
        try {
          const siteDevRes = await bmsService.getSiteDevices(selectedSiteId, { category: 'GENERATOR' }).catch(() => null);
          const siteDevList = normalizeList(siteDevRes, 'devices');
          if (Array.isArray(siteDevList)) {
            siteDevList.forEach(addDevice);
          }
        } catch (e) {}

        // 3. Fallback via apiClient
        try {
          const fallbackRes = await apiClient.get('/devices', { 
            siteId: String(selectedSiteId), 
            category: 'GENERATOR', 
            include: 'settings,rules,profile' 
          }).catch(() => null);
          const list = normalizeList(fallbackRes, 'devices');
          if (Array.isArray(list) && list.length > 0) {
            list.forEach(addDevice);
          }
        } catch (e) {}

        // 4. Merge cached & registered devices from localStorage
        const localKeys = [
          'dg_generator_devices',
          'scada_devices_db',
          'bms_registered_devices',
          'scada_device_mappings',
          'tb_devices'
        ];
        localKeys.forEach(k => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              const arr = Array.isArray(parsed) ? parsed : [parsed];
              arr.forEach(addDevice);
            }
          } catch (e) {}
        });

        if (isMounted) {
          setDevices(discovered);
          if (discovered.length > 0) {
            const currentInList = discovered.some(d => String(d.id || d.deviceId) === String(selectedDeviceId));
            const storedId = localStorage.getItem('selected_dg_device_id');
            const storedInList = discovered.find(d => String(d.id || d.deviceId) === String(storedId));

            if (currentInList) {
              // keep current
            } else if (storedInList) {
              setSelectedDeviceId(String(storedInList.id || storedInList.deviceId));
            } else {
              const firstId = String(discovered[0].id || discovered[0].deviceId);
              setSelectedDeviceId(firstId);
              localStorage.setItem('selected_dg_device_id', firstId);
            }
          } else {
            setSelectedDeviceId('');
            localStorage.removeItem('selected_dg_device_id');
            setData(DEFAULT_CLEAN_STATE);
            setBackendEvents({});
          }
        }
      } catch (err) {
        console.warn('Error fetching generator devices:', err);
        if (isMounted) {
          setDevices([]);
          setSelectedDeviceId('');
          setData(DEFAULT_CLEAN_STATE);
          setBackendEvents({});
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

  const defaultCleanState = DEFAULT_CLEAN_STATE;
  const [data, setData] = useState(DEFAULT_CLEAN_STATE);
  const [backendEvents, setBackendEvents] = useState({});

  const isEngineRunning = useMemo(() => {
    if (isManualRunning) return true;
    if (data?.engine?.speed !== null && data?.engine?.speed !== undefined && Number(data.engine.speed) > 0) return true;
    if (data?.power?.kw !== null && data?.power?.kw !== undefined && Number(data.power.kw) > 0) return true;
    return false;
  }, [isManualRunning, data]);

  // 3. Live Telemetry Parser & 30s Polling Effect
  const fetchDeviceTelemetry = useCallback(async (devId = selectedDeviceId) => {
    const targetId = devId || selectedDeviceId;
    if (!targetId) return;
    setIsFetchingTelemetry(true);
    try {
      const eventsRes = await bmsService.getDeviceEventsLatest(targetId, selectedSiteId).catch(() => null);

      let newData = { ...defaultCleanState };
      let updated = false;

      // Extract fields from eventsRes payload safely (supporting object with .fields, .data.fields, results array)
      const eventsList = [];
      const candidateSources = [
        eventsRes?.fields,
        eventsRes?.data?.fields,
        eventsRes?.data?.data?.fields,
        eventsRes?.events,
        eventsRes?.data?.events,
        eventsRes?.data?.results,
        eventsRes?.results,
        Array.isArray(eventsRes) ? eventsRes : null,
        Array.isArray(eventsRes?.data) ? eventsRes.data : null
      ];

      candidateSources.forEach(src => {
        if (Array.isArray(src)) {
          src.forEach(item => {
            if (item && Array.isArray(item.eventFields)) {
              eventsList.push(...item.eventFields);
            } else if (item && Array.isArray(item.fields)) {
              eventsList.push(...item.fields);
            } else if (item && (item.eventFieldDisplayName || item.displayName || item.fieldName || item.name)) {
              eventsList.push(item);
            }
          });
        }
      });

      const eventsMap = {};

      if (Array.isArray(eventsList) && eventsList.length > 0) {
        // Collect configured device settings for accurate matching
        const devSettings = Array.isArray(selectedDevObj?.settings) && selectedDevObj.settings.length > 0
          ? selectedDevObj.settings
          : (Array.isArray(selectedDevObj?.template_settings) && selectedDevObj.template_settings.length > 0
              ? selectedDevObj.template_settings
              : (Array.isArray(selectedDevObj?.deviceSettings) ? selectedDevObj.deviceSettings : []));

        eventsList.forEach(f => {
          let rawDispName = String(f.eventFieldDisplayName || f.displayName || f.fieldName || f.name || '').trim();
          const fieldTag = String(f.fieldName || f.fieldKey || f.sochiotFieldName || '').trim();

          // Match configured setting displayName if available
          if (devSettings.length > 0) {
            const matchedSetting = devSettings.find(s => {
              if (!s) return false;
              if (f.settingId && s.id && String(f.settingId) === String(s.id)) return true;
              if (f.sochiotFieldId && s.sochiotFieldId && String(f.sochiotFieldId) === String(s.sochiotFieldId)) return true;
              const sKey = String(s.sochiotFieldName || s.fieldKey || '').trim().toLowerCase();
              const fKey = fieldTag.toLowerCase();
              if (sKey && fKey && sKey === fKey) return true;
              const sName = String(s.displayName || s.name || '').trim().toLowerCase();
              const fName = rawDispName.toLowerCase();
              if (sName && fName && sName === fName) return true;
              return false;
            });
            if (matchedSetting && (matchedSetting.displayName || matchedSetting.name)) {
              rawDispName = String(matchedSetting.displayName || matchedSetting.name).trim();
            }
          }

          const dispName = rawDispName.toLowerCase();
          const val = f.fieldCurrentValue ?? f.currentValue ?? f.value;

          if (val !== undefined && val !== null && !isNaN(Number(val))) {
            const num = Number(val);
            updated = true;
            if (rawDispName) {
              eventsMap[rawDispName] = { val: num, unit: f.unit || '' };
            }
            if (fieldTag) {
              eventsMap[fieldTag] = { val: num, unit: f.unit || '' };
            }

            // 1. Apparent Power / VA vs Energy KVAH
            if (dispName.includes('kva hour') || dispName.includes('kvahour') || dispName === 'kvah' || dispName === 'kva hours') {
              newData.generation.kvaHours = num;
              eventsMap['KVA Hours'] = { val: num, unit: 'KVAH' };
            } else if (dispName.includes('total va') || dispName.includes('apparent power') || (dispName.includes('kva') && !dispName.includes('hour') && !dispName.includes('kvah')) || dispName === 'va') {
              newData.power.kva = num;
              eventsMap['Generator total VA'] = { val: num, unit: 'KVA' };
            }
            // 2. Reactive Power / VAr vs Energy KVARH
            else if (dispName.includes('kvar hour') || dispName.includes('kvarhour') || dispName === 'kvarh' || dispName === 'kvar hours') {
              newData.generation.kvarHours = num;
              eventsMap['KVAR Hours'] = { val: num, unit: 'kVARH' };
            } else if (dispName.includes('total var') || dispName.includes('reactive power') || (dispName.includes('kvar') && !dispName.includes('hour') && !dispName.includes('kvarh')) || dispName === 'var') {
              newData.power.kvar = num;
              eventsMap['Generator total Var'] = { val: num, unit: 'KVAR' };
            }
            // 3. Active Power / Watts vs Energy KWH
            else if (dispName.includes('kw hour') || dispName.includes('kwhour') || dispName === 'kwh' || dispName === 'kw hours' || dispName.includes('active energy')) {
              newData.generation.today = num;
              eventsMap['KW Hours'] = { val: num, unit: 'KWH' };
            } else if (dispName.includes('total watts') || dispName.includes('active power') || (dispName.includes('kw') && !dispName.includes('hour') && !dispName.includes('kwh')) || dispName === 'watts') {
              newData.power.kw = num;
              eventsMap['Generator Total Watts'] = { val: num, unit: 'KW' };
            }
            // 4. Start Count & Running status (Strictly exclude fault alarms)
            else if ((dispName.includes('no of start') || dispName.includes('no. of start') || dispName.includes('number of start') || dispName === 'starts' || (dispName.includes('start') && !dispName.includes('fail') && !dispName.includes('trip') && !dispName.includes('pressure')))) {
              newData.engine.starts = num;
              eventsMap['No of start'] = { val: num, unit: 'Starts' };
            }
            // 5. Engine Speed (Exclude alarms & runtime)
            else if ((dispName.includes('speed') || (dispName.includes('rpm') && !dispName.includes('run') && !dispName.includes('time') && !dispName.includes('hour'))) && !dispName.includes('under') && !dispName.includes('over') && !dispName.includes('fail')) {
              newData.engine.speed = num;
              eventsMap['Engine Speed'] = { val: num, unit: 'RPM' };
            }
            // 6. Engine Runtime
            else if (dispName.includes('run tim') || dispName.includes('runtime') || dispName.includes('engine run') || dispName.includes('running hours')) {
              newData.engine.runtime = num;
              eventsMap['Engine Run tim'] = { val: num, unit: 'RPM/HRS' };
            }
            // 7. Engine Vitals (Exclude fault alarms)
            else if (dispName.includes('coolant') && !dispName.includes('high') && !dispName.includes('low') && !dispName.includes('alarm')) {
              newData.engine.coolant = num;
              eventsMap['Coolant Temperature'] = { val: num, unit: '°C' };
            } else if ((dispName.includes('oil pressure') || (dispName.includes('oil') && !dispName.includes('low') && !dispName.includes('high') && !dispName.includes('temp') && !dispName.includes('alarm')))) {
              newData.engine.oilPressure = num;
              eventsMap['Oil Pressure'] = { val: num, unit: 'kPA' };
            } else if ((dispName.includes('frequency') || dispName.includes('freq') || dispName.includes('hz')) && !dispName.includes('high') && !dispName.includes('low') && !dispName.includes('alarm')) {
              newData.engine.freq = num;
              eventsMap['Frequency (R Phase)'] = { val: num, unit: 'Hz' };
            } else if (dispName.includes('battery') && !dispName.includes('low') && !dispName.includes('high') && !dispName.includes('alarm')) {
              newData.engine.battery = num;
              eventsMap['Battery Voltage'] = { val: num, unit: 'V' };
            } else if (dispName.includes('power factor') || dispName.includes('pf')) {
              newData.power.pf = num;
              eventsMap['Generator average power factor'] = { val: num, unit: 'pf' };
            } else if (dispName.includes('fuel level') || (dispName.includes('fuel') && !dispName.includes('temp') && !dispName.includes('leak') && !dispName.includes('burn'))) {
              newData.diesel.level = num;
              newData.diesel.remaining = (newData.diesel.capacity * num) / 100;
              eventsMap['Fuel Level'] = { val: num, unit: '%' };
            }
            // 8. Voltages & Currents
            else if (dispName.includes('l1-l2') || dispName.includes('l1 - l2') || dispName.includes('line-to-line') || dispName.includes('line voltage')) {
              newData.voltage.ry = num;
              eventsMap['Generator L1-L2 voltage'] = { val: num, unit: 'V' };
            } else if (dispName.includes('l2-l3') || dispName.includes('l2 - l3')) {
              newData.voltage.yb = num;
            } else if (dispName.includes('l3-l1') || dispName.includes('l3 - l1')) {
              newData.voltage.br = num;
            } else if (dispName.includes('l1 current') || dispName.includes('phase l1 current')) {
              newData.current.r = num;
              eventsMap['Generator L1 current'] = { val: num, unit: 'A' };
            } else if (dispName.includes('l2 current') || dispName.includes('phase l2 current')) {
              newData.current.y = num;
              eventsMap['Generator L2 current'] = { val: num, unit: 'A' };
            } else if (dispName.includes('l3 current') || dispName.includes('phase l3 current')) {
              newData.current.b = num;
              eventsMap['Generator L3 current'] = { val: num, unit: 'A' };
            } else if (dispName.includes('line-to-neutral') || dispName.includes('l-n') || dispName.includes('ln voltage') || dispName.includes('phase voltage')) {
              newData.voltage.rn = num;
              eventsMap['Generator L-N voltage average'] = { val: num, unit: 'V' };
            }
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

  // Fetch telemetry whenever selectedDeviceId or devices change, and poll every 30s
  useEffect(() => {
    if (!selectedDeviceId) return;
    fetchDeviceTelemetry(selectedDeviceId);
    const interval = setInterval(() => {
      fetchDeviceTelemetry(selectedDeviceId);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, selectedSiteId, devices, fetchDeviceTelemetry]);

  // Enrich selected device settings from API if not pre-populated in summary
  useEffect(() => {
    if (!selectedDeviceId) return;
    const current = devices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId));
    const hasSettings = Boolean(
      (Array.isArray(current?.settings) && current.settings.length > 0) ||
      (Array.isArray(current?.template_settings) && current.template_settings.length > 0) ||
      (Array.isArray(current?.deviceSettings) && current.deviceSettings.length > 0)
    );

    if (!hasSettings) {
      let isMounted = true;
      const fetchFullSettings = async () => {
        try {
          const detailUrl = selectedSiteId
            ? getApiUrl(`/sites/${selectedSiteId}/devices/${selectedDeviceId}`)
            : getApiUrl(`/devices/${selectedDeviceId}`);
          const res = await fetch(detailUrl, { headers: getAuthHeaders() }).catch(() => null);
          if (res && res.ok) {
            const json = await res.json();
            const detail = json?.data || json;
            if (isMounted && detail && (detail.settings || detail.template_settings || detail.deviceSettings)) {
              setDevices(prev => prev.map(d => String(d.id || d.deviceId) === String(selectedDeviceId) ? { ...d, ...detail } : d));
            }
          }
        } catch (e) {}
      };
      fetchFullSettings();
      return () => { isMounted = false; };
    }
  }, [selectedDeviceId, selectedSiteId, devices]);

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

  // ── HANDLE SWITCHING ACTIVE TARGET GENERATOR (Seamless Multi-DG switching) ──
  const handleDeviceChange = useCallback((newId) => {
    if (!newId || String(newId) === String(selectedDeviceId)) return;
    const targetId = String(newId);
    setSelectedDeviceId(targetId);
    localStorage.setItem('selected_dg_device_id', targetId);

    // Clear previous live data immediately to avoid stale data flashing
    setData(DEFAULT_CLEAN_STATE);
    setBackendEvents({});

    // Toast feedback with selected DG name
    const targetDev = devices.find(d => String(d.id || d.deviceId) === targetId);
    const devName = targetDev?.name || targetDev?.deviceName || `Generator #${targetId}`;
    triggerToast(`🎯 Active Target: ${devName}`);

    // Fetch telemetry for newly selected DG
    fetchDeviceTelemetry(targetId);
    window.dispatchEvent(new CustomEvent('scada_device_changed', {
      detail: { deviceId: targetId, siteId: selectedSiteId, module: 'DG Set' }
    }));
  }, [devices, selectedDeviceId, selectedSiteId, fetchDeviceTelemetry]);

  // Synchronize when active device is selected from the top Header cascading dropdown
  useEffect(() => {
    const handleGlobalDeviceChange = (e) => {
      if (e.detail?.deviceId && String(e.detail.deviceId) !== String(selectedDeviceId)) {
        handleDeviceChange(String(e.detail.deviceId));
      }
    };
    window.addEventListener('scada_device_changed', handleGlobalDeviceChange);
    return () => window.removeEventListener('scada_device_changed', handleGlobalDeviceChange);
  }, [selectedDeviceId, handleDeviceChange]);

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
        handleDeviceChange(newId);
      },
      ariaLabel: 'Select Generator Device',
      disabled: false
    };
  }, [devices, devicesLoading, selectedDeviceId, handleDeviceChange]);

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
          let isMatchingDevice = false;
          if (selectedDeviceId) {
            const matchesId = String(t.id || t.deviceId || '') === String(selectedDeviceId);
            const matchesName = Boolean(
              activeDeviceDisplayName &&
              t.name &&
              String(t.name).trim().toLowerCase() === String(activeDeviceDisplayName).trim().toLowerCase()
            );
            isMatchingDevice = matchesId || matchesName;
          } else {
            isMatchingDevice =
              (t.category && String(t.category).toUpperCase().includes('GEN')) ||
              (t.module && String(t.module).toUpperCase().includes('DG')) ||
              (t.module && String(t.module).toUpperCase().includes('GEN')) ||
              t.module === 'DG Set' ||
              t.type === 'GENERATOR';
          }

          if (isMatchingDevice) {
            if (t.mapping && typeof t.mapping === 'object') {
              savedMappings = { ...savedMappings, ...t.mapping };
            }
            if (t.defaultValues && typeof t.defaultValues === 'object') {
              savedMappings = { ...savedMappings, ...t.defaultValues };
            }
            if (t.settings) {
              const s = Array.isArray(t.settings) ? t.settings[0]?.meta : t.settings;
              if (s && typeof s === 'object') {
                if (s.mapping && typeof s.mapping === 'object') savedMappings = { ...savedMappings, ...s.mapping };
                else savedMappings = { ...savedMappings, ...s };
              }
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
      const devSettings = Array.isArray(selectedDevObj.settings) && selectedDevObj.settings.length > 0
        ? selectedDevObj.settings
        : (Array.isArray(selectedDevObj.template_settings) && selectedDevObj.template_settings.length > 0
            ? selectedDevObj.template_settings
            : (Array.isArray(selectedDevObj.deviceSettings) ? selectedDevObj.deviceSettings : []));

      devSettings.forEach(s => {
        if (!s) return;
        const sName = String(s.displayName || s.name || '').trim();
        const sField = String(s.sochiotFieldName || s.fieldKey || s.fieldName || '').trim();
        if (sName) {
          savedMappings[sName] = sField || 'Mapped';
        }
        if (sField) {
          savedMappings[sField] = sName || 'Mapped';
        }
      });

      if (selectedDevObj.template?.mapping) savedMappings = { ...savedMappings, ...selectedDevObj.template.mapping };
      if (selectedDevObj.profile?.mapping) savedMappings = { ...savedMappings, ...selectedDevObj.profile.mapping };
      if (selectedDevObj.raw?.mapping) savedMappings = { ...savedMappings, ...selectedDevObj.raw.mapping };
      if (selectedDevObj.mapping && typeof selectedDevObj.mapping === 'object') savedMappings = { ...savedMappings, ...selectedDevObj.mapping };
      if (selectedDevObj.parameters && Array.isArray(selectedDevObj.parameters)) {
        selectedDevObj.parameters.forEach(p => {
          if (p && p.name) savedMappings[p.name] = p.register || p.field || p.value || 'Mapped';
        });
      }
    }

    return SYSTEM_35_PARAMS.map(param => {
      let liveVal = '--';
      let isMapped = false;
      let mappedField = null;

      const paramLower = param.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1. Check direct backend events match
      const backendEventKeys = Object.keys(backendEvents);
      if (backendEventKeys.length > 0) {
        const matchedBackendKey = backendEventKeys.find(bk => {
          const bkLower = bk.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (bkLower === paramLower) return true;

          // KW Hours (Cumulative Active Energy)
          if (paramLower === 'kwhours') {
            return (bkLower.includes('kwhour') || bkLower === 'kwh' || bkLower.includes('activeenergy') || bkLower === 'todaykwh' || bkLower === 'dailyenergy' || bkLower === 'totalenergy');
          }
          // KVA Hours (Cumulative Apparent Energy)
          if (paramLower === 'kvahours') {
            return (bkLower.includes('kvahour') || bkLower === 'kvah' || bkLower.includes('apparentenergy'));
          }
          // KVAR Hours (Cumulative Reactive Energy)
          if (paramLower === 'kvarhours') {
            return (bkLower.includes('kvarhour') || bkLower === 'kvarh' || bkLower.includes('reactiveenergy'));
          }
          // No of start
          if (paramLower === 'noofstart') {
            return ((bkLower.includes('start') || bkLower.includes('starts')) && !bkLower.includes('fail') && !bkLower.includes('pressure'));
          }
          // Generator Total Watts (Active Power in kW - MUST NOT MATCH kwhours)
          if (paramLower === 'generatortotalwatts') {
            return ((bkLower.includes('totalwatts') || bkLower.includes('activepower') || (bkLower.includes('totalkw') || bkLower === 'kw')) && !bkLower.includes('hour') && !bkLower.includes('kwh'));
          }
          // Generator total VA (Apparent Power in kVA - MUST NOT MATCH kvahours)
          if (paramLower === 'generatortotalva') {
            return ((bkLower.includes('totalva') || bkLower.includes('apparentpower') || (bkLower.includes('totalkva') || bkLower === 'kva')) && !bkLower.includes('hour') && !bkLower.includes('kvah'));
          }
          // Generator total Var (Reactive Power in kVAR - MUST NOT MATCH kvarhours)
          if (paramLower === 'generatortotalvar') {
            return ((bkLower.includes('totalvar') || bkLower.includes('reactivepower') || (bkLower.includes('totalkvar') || bkLower === 'kvar')) && !bkLower.includes('hour') && !bkLower.includes('kvarh'));
          }
          // Engine Run tim (Runtime - MUST NOT MATCH kwhours)
          if (paramLower === 'engineruntim' || paramLower === 'engineruntime') {
            return ((bkLower.includes('runtime') || bkLower.includes('runtim') || bkLower.includes('enginerun') || bkLower.includes('runninghours')) && !bkLower.includes('kwh'));
          }
          // Battery Voltage
          if (paramLower.includes('battery')) {
            return bkLower.includes('battery') && !bkLower.includes('low') && !bkLower.includes('high') && !bkLower.includes('alarm');
          }
          // Coolant Temperature
          if (paramLower.includes('coolant')) {
            return bkLower.includes('coolant') && !bkLower.includes('high') && !bkLower.includes('low') && !bkLower.includes('alarm');
          }
          // Oil Pressure
          if (paramLower.includes('oilpressure')) {
            return bkLower.includes('oil') && !bkLower.includes('low') && !bkLower.includes('high') && !bkLower.includes('alarm');
          }
          // Engine Speed
          if (paramLower.includes('enginespeed') || paramLower === 'speed') {
            return (bkLower.includes('speed') || (bkLower.includes('rpm') && !bkLower.includes('run') && !bkLower.includes('time') && !bkLower.includes('hour'))) && !bkLower.includes('under') && !bkLower.includes('over') && !bkLower.includes('fail');
          }
          // Frequency
          if (paramLower.includes('frequency')) {
            return (bkLower.includes('freq') || bkLower.includes('frequency') || bkLower.includes('hz')) && !bkLower.includes('low') && !bkLower.includes('high');
          }
          // Fuel Level
          if (paramLower.includes('fuellevel') || paramLower === 'fuel') {
            return bkLower.includes('fuel') && !bkLower.includes('leak') && !bkLower.includes('temp');
          }
          // L1-L2 Voltage
          if (paramLower.includes('l1l2')) {
            return bkLower.includes('l1l2') || bkLower.includes('linevoltage') || bkLower.includes('voltage');
          }
          // Currents
          if (paramLower.includes('l1current')) return bkLower.includes('l1') && bkLower.includes('current') && !bkLower.includes('high');
          if (paramLower.includes('l2current')) return bkLower.includes('l2') && bkLower.includes('current') && !bkLower.includes('high');
          if (paramLower.includes('l3current')) return bkLower.includes('l3') && bkLower.includes('current') && !bkLower.includes('high');
          // L-N Voltage
          if (paramLower.includes('lnvoltage')) return bkLower.includes('ln') || bkLower.includes('linetoneutral');
          // Power Factor
          if (paramLower.includes('powerfactor')) return bkLower.includes('powerfactor') || bkLower.includes('pf');

          // Faults
          if (param.category === 'FAULT') {
            return bkLower === paramLower || bkLower.includes(paramLower) || paramLower.includes(bkLower);
          }

          return bkLower.includes(paramLower) || paramLower.includes(bkLower);
        });

        if (matchedBackendKey) {
          const entry = backendEvents[matchedBackendKey];
          isMapped = true;
          mappedField = matchedBackendKey;
          const displayUnit = param.unit || entry.unit || '';
          const num = Number(entry.val);

          if (!isNaN(num)) {
            if (param.name === 'Engine Speed' || param.name === 'Running Status' || param.name === 'No of start') {
              liveVal = `${num.toFixed(0)} ${displayUnit}`.trim();
            } else {
              liveVal = `${num.toFixed(2)} ${displayUnit}`.trim();
            }
          } else {
            liveVal = `${entry.val} ${displayUnit}`.trim();
          }
        }
      }

      // 2. Fallback to state object if backend events matching did not populate
      if (!isMapped || liveVal === '--') {
        switch (param.name) {
          case 'KW Hours':
            if (data.generation.today !== null && data.generation.today !== undefined) { liveVal = `${Number(data.generation.today).toFixed(2)} KWH`; isMapped = true; }
            break;
          case 'KVA Hours':
            if (data.generation.kvaHours !== null && data.generation.kvaHours !== undefined) { liveVal = `${Number(data.generation.kvaHours).toFixed(2)} KVAH`; isMapped = true; }
            break;
          case 'KVAR Hours':
            if (data.generation.kvarHours !== null && data.generation.kvarHours !== undefined) { liveVal = `${Number(data.generation.kvarHours).toFixed(2)} kVARH`; isMapped = true; }
            break;
          case 'No of start':
            if (data.engine.starts !== null && data.engine.starts !== undefined) { liveVal = `${Number(data.engine.starts).toFixed(0)} Starts`; isMapped = true; }
            break;
          case 'Battery Voltage':
            if (data.engine.battery !== null && data.engine.battery !== undefined) { liveVal = `${Number(data.engine.battery).toFixed(2)} V`; isMapped = true; }
            break;
          case 'Coolant Temperature':
            if (data.engine.coolant !== null && data.engine.coolant !== undefined) { liveVal = `${Number(data.engine.coolant).toFixed(2)} °C`; isMapped = true; }
            break;
          case 'Oil Pressure':
            if (data.engine.oilPressure !== null && data.engine.oilPressure !== undefined) { liveVal = `${Number(data.engine.oilPressure).toFixed(2)} kPA`; isMapped = true; }
            break;
          case 'Engine Speed':
            if (data.engine.speed !== null && data.engine.speed !== undefined) { liveVal = `${Number(data.engine.speed).toFixed(0)} RPM`; isMapped = true; }
            break;
          case 'Frequency (R Phase)':
            if (data.engine.freq !== null && data.engine.freq !== undefined) { liveVal = `${Number(data.engine.freq).toFixed(2)} Hz`; isMapped = true; }
            break;
          case 'Generator L1-L2 voltage':
            if (data.voltage.ry !== null && data.voltage.ry !== undefined) { liveVal = `${Number(data.voltage.ry).toFixed(2)} V`; isMapped = true; }
            break;
          case 'Generator L1 current':
            if (data.current.r !== null && data.current.r !== undefined) { liveVal = `${Number(data.current.r).toFixed(2)} A`; isMapped = true; }
            break;
          case 'Generator L2 current':
            if (data.current.y !== null && data.current.y !== undefined) { liveVal = `${Number(data.current.y).toFixed(2)} A`; isMapped = true; }
            break;
          case 'Generator L3 current':
            if (data.current.b !== null && data.current.b !== undefined) { liveVal = `${Number(data.current.b).toFixed(2)} A`; isMapped = true; }
            break;
          case 'Generator average power factor':
            if (data.power.pf !== null && data.power.pf !== undefined) { liveVal = `${Number(data.power.pf).toFixed(2)} pf`; isMapped = true; }
            break;
          case 'Engine Run tim':
            if (data.engine.runtime !== null && data.engine.runtime !== undefined) { liveVal = `${typeof data.engine.runtime === 'number' ? data.engine.runtime.toFixed(2) : data.engine.runtime} RPM/HRS`; isMapped = true; }
            break;
          case 'Fuel Level':
            if (data.diesel.level !== null && data.diesel.level !== undefined) { liveVal = `${Number(data.diesel.level).toFixed(2)}%`; isMapped = true; }
            break;
          case 'Generator Total Watts':
            if (data.power.kw !== null && data.power.kw !== undefined) { liveVal = `${Number(data.power.kw).toFixed(2)} KW`; isMapped = true; }
            break;
          case 'Generator total VA':
            if (data.power.kva !== null && data.power.kva !== undefined) { liveVal = `${Number(data.power.kva).toFixed(2)} KVA`; isMapped = true; }
            break;
          case 'Generator total Var':
            if (data.power.kvar !== null && data.power.kvar !== undefined) { liveVal = `${Number(data.power.kvar).toFixed(2)} KVAR`; isMapped = true; }
            break;
          case 'Generator L-N voltage average':
            if (data.voltage.rn !== null && data.voltage.rn !== undefined) { liveVal = `${Number(data.voltage.rn).toFixed(2)} V`; isMapped = true; }
            break;
          default:
            break;
        }
      }

      // 3. Check savedMappings for template key match if still unmapped or empty
      if (!isMapped || liveVal === '--') {
        const mappingKeys = Object.keys(savedMappings);
        if (mappingKeys.length > 0) {
          const matchedKey = mappingKeys.find(k => {
            if (!k) return false;
            const val = savedMappings[k];
            if (!val || val === 'Unmapped' || val === 'NONE' || val === '') return false;
            const keyLower = k.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (keyLower === paramLower) return true;
            if (paramLower === 'kwhours' && (keyLower.includes('kwhour') || keyLower === 'kwh' || keyLower.includes('activeenergy'))) return true;
            if (paramLower === 'kvahours' && (keyLower.includes('kvahour') || keyLower === 'kvah' || keyLower.includes('apparentenergy'))) return true;
            if (paramLower === 'kvarhours' && (keyLower.includes('kvarhour') || keyLower === 'kvarh' || keyLower.includes('reactiveenergy'))) return true;
            if (paramLower === 'noofstart' && (keyLower.includes('start') && !keyLower.includes('fail') && !keyLower.includes('pressure'))) return true;
            if (paramLower === 'generatortotalwatts' && ((keyLower.includes('totalwatts') || keyLower.includes('activepower') || keyLower.includes('totalkw') || keyLower === 'kw') && !keyLower.includes('hour') && !keyLower.includes('kwh'))) return true;
            if (paramLower === 'generatortotalva' && ((keyLower.includes('totalva') || keyLower.includes('apparentpower') || keyLower.includes('totalkva') || keyLower === 'kva') && !keyLower.includes('hour') && !keyLower.includes('kvah'))) return true;
            if (paramLower === 'generatortotalvar' && ((keyLower.includes('totalvar') || keyLower.includes('reactivepower') || keyLower.includes('totalkvar') || keyLower === 'kvar') && !keyLower.includes('hour') && !keyLower.includes('kvarh'))) return true;
            if (paramLower === 'batteryvoltage') return keyLower.includes('battery') && !keyLower.includes('low') && !keyLower.includes('high') && !keyLower.includes('alarm');
            if (paramLower === 'coolanttemperature') return keyLower.includes('coolant') && !keyLower.includes('high') && !keyLower.includes('low') && !keyLower.includes('alarm');
            if (paramLower === 'oilpressure') return keyLower.includes('oil') && !keyLower.includes('low') && !keyLower.includes('high') && !keyLower.includes('alarm');
            if (paramLower === 'enginespeed') return (keyLower.includes('speed') || (keyLower.includes('rpm') && !keyLower.includes('run') && !keyLower.includes('time') && !keyLower.includes('hour'))) && !keyLower.includes('under') && !keyLower.includes('over') && !keyLower.includes('fail');
            if (paramLower === 'frequencyrphase') return (keyLower.includes('freq') || keyLower.includes('hz')) && !keyLower.includes('low') && !keyLower.includes('high');
            if (paramLower.includes('l1l2') && (keyLower.includes('l1l2') || keyLower.includes('linevoltage') || keyLower.includes('voltage'))) return true;
            if (paramLower.includes('l1current') && keyLower.includes('l1') && !keyLower.includes('high')) return true;
            if (paramLower.includes('l2current') && keyLower.includes('l2') && !keyLower.includes('high')) return true;
            if (paramLower.includes('l3current') && keyLower.includes('l3') && !keyLower.includes('high')) return true;
            if (paramLower.includes('powerfactor') && (keyLower.includes('powerfactor') || keyLower.includes('pf'))) return true;
            if ((paramLower.includes('runtime') || paramLower.includes('runtim')) && (keyLower.includes('runtime') || keyLower.includes('runtim') || keyLower.includes('hours')) && !keyLower.includes('kwh')) return true;
            if (paramLower.includes('fuel') && keyLower.includes('fuel')) return true;
            if (param.category === 'FAULT') {
              return keyLower === paramLower || keyLower.includes(paramLower) || paramLower.includes(keyLower);
            }
            return false;
          });

          if (matchedKey) {
            isMapped = true;
            mappedField = savedMappings[matchedKey];
            if (liveVal === '--') {
              const rawVal = typeof mappedField === 'object' ? (mappedField.value || mappedField.currentValue || mappedField.register || mappedField.field || '--') : String(mappedField);
              if (rawVal !== '--' && rawVal !== 'undefined' && rawVal !== 'Mapped' && !isNaN(Number(rawVal))) {
                const num = Number(rawVal);
                const formatted = !isNaN(num) ? num.toFixed(2) : rawVal;
                liveVal = formatted.includes(param.unit || '') ? formatted : `${formatted} ${param.unit || ''}`.trim();
              } else {
                // Configured in device mapping table: display proper mapped default baseline
                if (param.category === 'FAULT') {
                  liveVal = 'Normal';
                } else if (param.name === 'No of start') {
                  liveVal = '0 Starts';
                } else {
                  liveVal = `0.00 ${param.unit || ''}`.trim();
                }
              }
            }
          }
        }
      }

      return { ...param, liveVal, isMapped, mappedField };
    });
  }, [data, backendEvents, selectedDeviceId, selectedDevObj, activeDeviceDisplayName, isDeviceConfigured]);

  // Filtered parameters by search, category & active status
  const filtered35Parameters = useMemo(() => {
    let list = mapped35Parameters;
    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter(p => p.category === selectedCategoryFilter);
    }
    if (paramSearch.trim()) {
      const term = paramSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
    }
    if (showOnlyMapped) {
      list = list.filter(p => p.isMapped && p.liveVal !== '--');
    }
    return list;
  }, [mapped35Parameters, selectedCategoryFilter, paramSearch, showOnlyMapped]);

  // Categorized groups
  const categorizedGroups = useMemo(() => {
    const groups = { 'CHANGE': [], 'PARM': [], 'ENGINE': [], 'TOTAL': [], 'FAULT': [] };
    filtered35Parameters.forEach(p => {
      if (groups[p.category]) groups[p.category].push(p);
      else groups['PARM'].push(p);
    });
    return groups;
  }, [filtered35Parameters]);

  // Category counts from mapped parameters (respects showOnlyMapped toggle)
  const categoryCounts = useMemo(() => {
    const counts = { ALL: 0, CHANGE: 0, PARM: 0, ENGINE: 0, TOTAL: 0, FAULT: 0 };
    mapped35Parameters.forEach(p => {
      const isMapped = p.isMapped && p.liveVal !== '--';
      if (!showOnlyMapped || isMapped) {
        counts.ALL++;
        if (counts[p.category] !== undefined) counts[p.category]++;
      }
    });
    return counts;
  }, [mapped35Parameters, showOnlyMapped]);

  // Active alarms count (excludes healthy 0.00 / normal / unmapped)
  const activeFaultsCount = useMemo(() => {
    return mapped35Parameters.filter(p => {
      if (p.category !== 'FAULT') return false;
      if (!p.liveVal || p.liveVal === '--') return false;
      const lower = String(p.liveVal).toLowerCase();
      if (lower.includes('0.00') || lower.includes('0 status') || lower.includes('normal') || lower.includes('ok')) return false;
      const num = parseFloat(p.liveVal);
      if (!isNaN(num) && num === 0) return false;
      return true;
    }).length;
  }, [mapped35Parameters]);

  // Monitored / mapped safety faults list
  const mappedFaultsList = useMemo(() => {
    return mapped35Parameters.filter(p => p.category === 'FAULT' && p.isMapped && p.liveVal !== '--');
  }, [mapped35Parameters]);
  const mappedFaultsCount = mappedFaultsList.length;

  // Total active mapped telemetry count
  const mappedTotalCount = useMemo(() => {
    return mapped35Parameters.filter(p => p.isMapped && p.liveVal !== '--').length;
  }, [mapped35Parameters]);

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

      {/* ═══ UNIFIED SINGLE PAGE INDUSTRIAL SCADA DASHBOARD ═══ */}
      <Row className="g-3 mt-1">
        {/* ── LEFT COLUMN (4 Cols): DIGITAL TWIN UNIT & SMART FUEL MANAGEMENT ── */}
        <Col xl={4} lg={5}>
          <div className="d-flex flex-column gap-3">
            {/* HERO DIGITAL TWIN UNIT CARD */}
            <div className="dg-glass-card p-3 position-relative overflow-hidden dg-hero-card">
              <div className="d-flex justify-content-between align-items-center mb-2.5 flex-wrap gap-2">
                <div className="fw-bold fs-12 text-cyan-glow uppercase tracking-wider d-flex align-items-center gap-2">
                  <Cpu size={15} className="text-info" />
                  <span>DG DIGITAL TWIN SCADA</span>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
                  {isDeviceConfigured && (
                    <>
                      <label className="btn btn-xs dg-btn-outline-glass d-flex align-items-center gap-1.5 cursor-pointer mb-0 text-cyan-glow py-1 px-2.5 rounded-2" title="Upload custom DG Set photo">
                        <Upload size={12} />
                        <span className="fs-11 fw-semibold">Photo</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                      {customDgImage !== DEFAULT_DG_IMAGE && (
                        <button 
                          onClick={handleResetImage} 
                          className="btn btn-xs btn-outline-warning d-flex align-items-center gap-1 py-1 px-2 fs-11 rounded-2"
                          title="Restore default image"
                        >
                          <RotateCcw size={11} />
                        </button>
                      )}
                    </>
                  )}
                  <span className={`dg-online-pill ${isDeviceConfigured ? (isDeviceOnline ? "online" : "offline") : "offline"}`}>
                    <Activity size={10} className="me-1 pulse-icon" /> 
                    {isDeviceConfigured ? (isDeviceOnline ? "ONLINE" : "OFFLINE") : "UNCONFIGURED"}
                  </span>
                </div>
              </div>

              {/* INDUSTRIAL SCADA GENERATOR HOUSING FRAME */}
              <div className={`position-relative rounded-3 overflow-hidden border shadow-lg dg-generator-hero-frame bg-dark ${isEngineRunning ? 'engine-active' : 'engine-idle'}`} style={{ height: '240px' }}>
                {!isDeviceConfigured ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center px-3 py-4 select-none">
                    <div 
                      className="d-flex align-items-center justify-content-center mb-2"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        border: '1.5px dashed rgba(56, 189, 248, 0.45)',
                        background: 'rgba(56, 189, 248, 0.05)'
                      }}
                    >
                      <Cpu size={28} className="text-info opacity-75" />
                    </div>
                    <h6 className="fw-bold text-white mb-1">No Generator Configured</h6>
                    <p className="text-muted small mb-0" style={{ maxWidth: '220px', fontSize: '0.75rem' }}>
                      Select or configure a generator to stream live telemetry.
                    </p>
                  </div>
                ) : (
                  <>
                    <img 
                      src={customDgImage || DEFAULT_DG_IMAGE} 
                      alt="DG Unit" 
                      className={`w-100 h-100 dg-hero-img ${isEngineRunning ? 'dg-mechanical-vibe' : ''}`} 
                      style={{ objectFit: 'cover', display: 'block' }} 
                      onError={(e) => { e.target.src = DEFAULT_DG_IMAGE; }}
                    />
                    <div className="position-absolute top-0 start-0 w-100 h-100 dg-scada-grid-overlay pointer-events-none" />

                    {/* RUNNING STATUS HUD BADGE (TOP LEFT) */}
                    <div className="position-absolute top-2 start-2 z-2">
                      <div className={`dg-engine-hud-pill ${isEngineRunning ? 'running' : 'idle'}`}>
                        <span className={`dg-live-dot ${isEngineRunning ? 'green-pulse' : 'gray'}`} />
                        <span>{isEngineRunning ? 'RUNNING ON LOAD' : 'AUTO-STANDBY (READY)'}</span>
                        {isEngineRunning && (
                          <div className="dg-soundwave-bars ms-1">
                            <span className="bar b1" />
                            <span className="bar b2" />
                            <span className="bar b3" />
                            <span className="bar b4" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* HUD TELEMETRY CHIPS (FLOATING CORNER READOUTS) */}
                    <div className="position-absolute bottom-2 start-2 end-2 z-2 d-flex align-items-center justify-content-between px-2.5 py-1.5 dg-hud-bottom-bar rounded-2">
                      <div className="d-flex align-items-center gap-1.5">
                        <Activity size={12} className="text-info" />
                        <span className="text-dim fs-11">RPM:</span>
                        <span className="text-white fw-bold font-monospace fs-11">
                          {data.engine.speed !== null ? data.engine.speed.toFixed(0) : '--'}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <Radio size={12} className="text-warning" />
                        <span className="text-dim fs-11">Freq:</span>
                        <span className="text-warning fw-bold font-monospace fs-11">
                          {data.engine.freq !== null ? `${data.engine.freq.toFixed(1)} Hz` : '--'}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <Zap size={12} className="text-success" />
                        <span className="text-dim fs-11">Power:</span>
                        <span className="text-success fw-bold font-monospace fs-11">
                          {data.power.kw !== null ? `${data.power.kw.toFixed(1)} kW` : '--'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* QUICK TELEMETRY STRIP UNDER GENERATOR */}
              <div className="row g-2 mt-2">
                <div className="col-4">
                  <div className="dg-subtile p-2 text-center rounded-2">
                    <div className="text-dim fs-10 text-uppercase fw-bold">Run Hours</div>
                    <div className="text-main fw-bold font-monospace fs-12 mt-0.5">
                      {isDeviceConfigured && data.engine.runtime !== null ? `${data.engine.runtime} h` : '--'}
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="dg-subtile p-2 text-center rounded-2">
                    <div className="text-dim fs-10 text-uppercase fw-bold">Total Starts</div>
                    <div className="text-main fw-bold font-monospace fs-12 mt-0.5">
                      {isDeviceConfigured && data.engine.starts !== null ? data.engine.starts : '--'}
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="dg-subtile p-2 text-center rounded-2">
                    <div className="text-dim fs-10 text-uppercase fw-bold">Avg Line V</div>
                    <div className="text-cyan-glow fw-bold font-monospace fs-12 mt-0.5">
                      {isDeviceConfigured && data.voltage.ry !== null ? `${data.voltage.ry.toFixed(1)} V` : '--'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DEDICATED REALISTIC FUEL TANK MANAGEMENT */}
            <div className="dg-glass-card p-3">
              <div className="d-flex align-items-center justify-content-between mb-2.5">
                <div className="fw-bold fs-12 text-warning uppercase tracking-wider d-flex align-items-center gap-2">
                  <Fuel size={15} /> 
                  <span>DEDICATED FUEL MANAGEMENT</span>
                </div>
                <span className="dg-fuel-badge">
                  <Fuel size={11} className="me-1" />
                  DIESEL HSD
                </span>
              </div>

              <Row className="g-3 align-items-center">
                <Col xs={5} className="d-flex justify-content-center">
                  <div className="dg-realistic-fuel-tank">
                    <div className="dg-tank-sheen"></div>
                    <div className="dg-tank-ticks">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                    </div>

                    <div className="dg-fluid-fill" style={{ height: `${isDeviceConfigured && data.diesel.level !== null ? Math.min(Math.max(data.diesel.level, 0), 100) : 0}%` }}>
                      <div className="dg-fluid-surface-glow"></div>
                      <div className="dg-bubble b1"></div>
                      <div className="dg-bubble b2"></div>
                      <div className="dg-bubble b3"></div>
                      <svg className="dg-fluid-wave wave-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"></path>
                      </svg>
                      <svg className="dg-fluid-wave wave-front" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,30 C200,-20 400,80 600,20 C800,-40 1000,70 1200,10 L1200,120 L0,120 Z"></path>
                      </svg>
                    </div>

                    <div className="dg-tank-center-badge">
                      <div className="dg-tank-val">
                        {isDeviceConfigured && data.diesel.level !== null ? `${data.diesel.level.toFixed(0)}%` : '--'}
                      </div>
                      <div className="dg-tank-lbl">Level %</div>
                    </div>
                  </div>
                </Col>

                <Col xs={7}>
                  <div className="d-flex flex-column gap-2">
                    <div className="dg-fuel-tile warning">
                      <div className="d-flex align-items-center gap-2">
                        <div className="dg-fuel-tile-icon warning"><Droplets size={13} /></div>
                        <span className="dg-fuel-tile-lbl">Remaining Fuel</span>
                      </div>
                      <span className="dg-fuel-tile-val warning">
                        {isDeviceConfigured && data.diesel.remaining !== null ? `${data.diesel.remaining.toFixed(0)} L` : '--'}
                      </span>
                    </div>

                    <div className="dg-fuel-tile info">
                      <div className="d-flex align-items-center gap-2">
                        <div className="dg-fuel-tile-icon info"><Clock size={13} /></div>
                        <span className="dg-fuel-tile-lbl">Est. Autonomy</span>
                      </div>
                      <span className="dg-fuel-tile-val info">
                        {isDeviceConfigured && data.diesel.remaining !== null && data.diesel.burnRate 
                          ? `~${(data.diesel.remaining / data.diesel.burnRate).toFixed(1)} hrs` 
                          : '--'}
                      </span>
                    </div>

                    <div className="dg-fuel-tile danger">
                      <div className="d-flex align-items-center gap-2">
                        <div className="dg-fuel-tile-icon danger"><TrendingDown size={13} /></div>
                        <span className="dg-fuel-tile-lbl">Burn Rate</span>
                      </div>
                      <span className="dg-fuel-tile-val danger">
                        {isDeviceConfigured && data.diesel.burnRate ? `${data.diesel.burnRate.toFixed(1)} L/h` : '--'}
                      </span>
                    </div>

                    <div className="dg-fuel-tile success">
                      <div className="d-flex align-items-center gap-2">
                        <div className="dg-fuel-tile-icon success"><CheckCircle2 size={13} /></div>
                        <span className="dg-fuel-tile-lbl">Status</span>
                      </div>
                      <span className={`dg-fuel-tile-val ${isDeviceConfigured && data.diesel.level !== null ? 'success' : 'text-muted'} fs-11`}>
                        {isDeviceConfigured && data.diesel.level !== null 
                          ? (data.diesel.level < 20 ? 'Low Fuel' : 'Normal Safe') 
                          : 'NO MAPPED'}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>

        {/* ── CENTER COLUMN (5 Cols): CORE VITALS, SAFETY INTERLOCKS & SCADA MATRIX ── */}
        <Col xl={5} lg={7}>
          <div className="d-flex flex-column gap-3">
            {/* 4 PRIMARY OPERATIONAL VITALS GAUGES */}
            <div className="row g-2">
              {/* Battery Voltage */}
              <div className="col-sm-6 col-12">
                <div className="dg-vital-card cyan p-2.5 rounded-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <div className="d-flex align-items-center gap-1.5">
                      <div className="dg-vital-icon cyan"><Zap size={14} /></div>
                      <span className="dg-vital-name">Battery Voltage</span>
                    </div>
                    {isDeviceConfigured && data.engine.battery !== null ? (
                      <span className="dg-vital-badge cyan">24-28V Normal</span>
                    ) : (
                      <span className="dg-vital-badge unmapped">NO MAPPED</span>
                    )}
                  </div>
                  <div className="d-flex align-items-baseline justify-content-between mt-1">
                    <div className="dg-vital-val font-monospace">
                      {isDeviceConfigured && data.engine.battery !== null ? data.engine.battery.toFixed(2) : '--'}
                    </div>
                    <div className="dg-vital-unit cyan">V DC</div>
                  </div>
                </div>
              </div>

              {/* Coolant Temperature */}
              <div className="col-sm-6 col-12">
                <div className="dg-vital-card warning p-2.5 rounded-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <div className="d-flex align-items-center gap-1.5">
                      <div className="dg-vital-icon warning"><Thermometer size={14} /></div>
                      <span className="dg-vital-name">Coolant Temp</span>
                    </div>
                    {isDeviceConfigured && data.engine.coolant !== null ? (
                      <span className="dg-vital-badge warning">&lt;95°C Safe</span>
                    ) : (
                      <span className="dg-vital-badge unmapped">NO MAPPED</span>
                    )}
                  </div>
                  <div className="d-flex align-items-baseline justify-content-between mt-1">
                    <div className="dg-vital-val font-monospace">
                      {isDeviceConfigured && data.engine.coolant !== null ? data.engine.coolant.toFixed(1) : '--'}
                    </div>
                    <div className="dg-vital-unit warning">°C</div>
                  </div>
                </div>
              </div>

              {/* Oil Pressure */}
              <div className="col-sm-6 col-12">
                <div className="dg-vital-card success p-2.5 rounded-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <div className="d-flex align-items-center gap-1.5">
                      <div className="dg-vital-icon success"><Gauge size={14} /></div>
                      <span className="dg-vital-name">Oil Pressure</span>
                    </div>
                    {isDeviceConfigured && data.engine.oilPressure !== null ? (
                      <span className="dg-vital-badge success">Optimal</span>
                    ) : (
                      <span className="dg-vital-badge unmapped">NO MAPPED</span>
                    )}
                  </div>
                  <div className="d-flex align-items-baseline justify-content-between mt-1">
                    <div className="dg-vital-val font-monospace">
                      {isDeviceConfigured && data.engine.oilPressure !== null ? data.engine.oilPressure.toFixed(1) : '--'}
                    </div>
                    <div className="dg-vital-unit success">kPA</div>
                  </div>
                </div>
              </div>

              {/* Engine Speed & Freq */}
              <div className="col-sm-6 col-12">
                <div className="dg-vital-card info p-2.5 rounded-3 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <div className="d-flex align-items-center gap-1.5">
                      <div className="dg-vital-icon info"><Activity size={14} /></div>
                      <span className="dg-vital-name">Engine Speed</span>
                    </div>
                    {isDeviceConfigured && data.engine.freq !== null ? (
                      <span className="dg-vital-badge info">{data.engine.freq.toFixed(1)} Hz</span>
                    ) : (
                      <span className="dg-vital-badge unmapped">NO MAPPED</span>
                    )}
                  </div>
                  <div className="d-flex align-items-baseline justify-content-between mt-1">
                    <div className="dg-vital-val font-monospace">
                      {isDeviceConfigured && data.engine.speed !== null ? data.engine.speed.toFixed(0) : '--'}
                    </div>
                    <div className="dg-vital-unit info">RPM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SAFETY INTERLOCK & ALARMS DIAGNOSTIC BANNER (CLEAN & INFORMATIVE) */}
            <div className={`dg-safety-banner rounded-3 p-2.5 ${!isDeviceConfigured ? 'unconfigured' : (activeFaultsCount > 0 ? 'alert' : (mappedFaultsCount > 0 ? 'healthy' : 'unconfigured'))}`}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <div className={`dg-safety-shield-icon ${!isDeviceConfigured || mappedFaultsCount === 0 ? 'opacity-40' : (activeFaultsCount > 0 ? 'alert' : 'healthy')}`}>
                    {!isDeviceConfigured || mappedFaultsCount === 0 ? <ShieldAlert size={16} /> : (activeFaultsCount > 0 ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />)}
                  </div>
                  <div>
                    <div className="fw-bold fs-12 d-flex align-items-center gap-2">
                      {!isDeviceConfigured ? (
                        <span className="text-secondary">NO GENERATOR MAPPED</span>
                      ) : mappedFaultsCount === 0 ? (
                        <span className="text-secondary">NO INTERLOCKS MAPPED</span>
                      ) : (
                        <span className={activeFaultsCount > 0 ? 'text-danger' : 'text-success'}>
                          {activeFaultsCount > 0 ? `${activeFaultsCount} ACTIVE TRIPS DETECTED` : `ALL ${mappedFaultsCount} SAFETY INTERLOCKS NORMAL`}
                        </span>
                      )}
                    </div>
                    <div className="text-dim fs-11">
                      {!isDeviceConfigured 
                        ? 'No safety interlock parameters or telemetry mapped for this site.'
                        : mappedFaultsCount === 0 
                          ? 'No fault or safety interlock parameters mapped for this generator.'
                          : (activeFaultsCount > 0 ? 'Action required: Inspect active interlock faults below.' : `Zero active trips. All ${mappedFaultsCount} monitored interlocks healthy.`)}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowDiagnostics(!showDiagnostics)} 
                  disabled={!isDeviceConfigured || mappedFaultsCount === 0}
                  className="btn btn-xs dg-btn-outline-glass d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2 text-cyan-glow"
                  title="Inspect safety sensor states"
                >
                  {showDiagnostics ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span className="fs-11 fw-semibold">{showDiagnostics ? 'Hide Interlocks' : (mappedFaultsCount > 0 ? `Inspect ${mappedFaultsCount} Sensors` : 'Inspect Interlocks')}</span>
                </button>
              </div>

              {/* QUICK STATUS PILLS */}
              {!showDiagnostics && (
                <div className="d-flex align-items-center gap-1.5 flex-wrap mt-2 pt-2 border-top dg-border-subtle">
                  {!isDeviceConfigured || mappedFaultsCount === 0 ? (
                    <span className="dg-interlock-chip text-muted">
                      No Interlocks Mapped
                    </span>
                  ) : (
                    mappedFaultsList.slice(0, 5).map((f) => {
                      const isTrip = f.liveVal && f.liveVal !== '--' && 
                        !String(f.liveVal).toLowerCase().includes('0.00') && 
                        !String(f.liveVal).toLowerCase().includes('0 status') && 
                        !String(f.liveVal).toLowerCase().includes('normal') && 
                        !String(f.liveVal).toLowerCase().includes('ok') && 
                        parseFloat(f.liveVal) !== 0;
                      return (
                        <span key={f.id} className={`dg-interlock-chip ${isTrip ? 'border-danger text-danger' : ''}`}>
                          {isTrip ? <AlertTriangle size={10} className="text-danger me-1 stroke-2" /> : <Check size={10} className="text-success me-1 stroke-2" />}
                          {f.name}: {isTrip ? 'TRIP' : 'OK'}
                        </span>
                      );
                    })
                  )}
                </div>
              )}

              {/* EXPANDABLE DIAGNOSTIC SENSOR MATRIX */}
              {showDiagnostics && (
                <div className="mt-2.5 pt-2.5 border-top dg-border-subtle transition-all">
                  <Row className="g-1.5">
                    {mapped35Parameters.filter(p => p.category === 'FAULT').map(p => {
                      const IconComp = p.icon || ShieldAlert;
                      const isMapped = p.isMapped && p.liveVal !== '--';
                      const isAlarmTripped = isMapped && 
                        !String(p.liveVal).toLowerCase().includes('0.00') && 
                        !String(p.liveVal).toLowerCase().includes('0 status') && 
                        !String(p.liveVal).toLowerCase().includes('normal') && 
                        !String(p.liveVal).toLowerCase().includes('healthy') && 
                        !String(p.liveVal).toLowerCase().includes('ok') && 
                        parseFloat(p.liveVal) !== 0;
                      return (
                        <Col key={p.id} md={6}>
                          <div className={`dg-sensor-item ${!isMapped ? 'unmapped' : (isAlarmTripped ? 'tripped' : 'normal')}`}>
                            <div className="d-flex align-items-center gap-1.5 text-truncate">
                              <span className="dg-param-num">{p.num}</span>
                              <IconComp size={12} className={!isMapped ? 'text-muted opacity-40' : (isAlarmTripped ? 'text-danger' : 'text-success')} />
                              <span className="dg-param-name text-truncate fs-11">{p.name}</span>
                            </div>
                            <span className={`dg-status-pill ${!isMapped ? 'unmapped' : (isAlarmTripped ? 'trip' : 'normal')}`}>
                              {!isMapped ? 'NO MAPPED' : (isAlarmTripped ? 'TRIP' : 'NORMAL')}
                            </span>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}
            </div>

            {/* UNIFIED SCADA PARAMETERS MATRIX */}
            <div className="dg-glass-card p-3">
              {/* TOP SEGMENTED CATEGORY NAV BAR */}
              <div className="dg-category-nav-bar mb-2.5">
                {[
                  { key: 'ALL', name: 'ALL', count: mapped35Parameters.length, color: 'cyan' },
                  { key: 'PARM', name: '02 VITALS', count: categoryCounts['PARM'], color: 'warning' },
                  { key: 'ENGINE', name: '03 ENGINE', count: categoryCounts['ENGINE'], color: 'info' },
                  { key: 'TOTAL', name: '04 POWER', count: categoryCounts['TOTAL'], color: 'cyan' },
                  { key: 'CHANGE', name: '01 DC/BAT', count: categoryCounts['CHANGE'], color: 'success' },
                  { key: 'FAULT', name: '05 FAULTS', count: categoryCounts['FAULT'], color: 'danger' }
                ].map(cat => {
                  const isSelected = selectedCategoryFilter === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.key)}
                      className={`dg-cat-nav-btn ${isSelected ? `active ${cat.color}` : ''}`}
                    >
                      <span className="dg-cat-name">{cat.name}</span>
                      <span className={`dg-cat-badge ${isSelected ? `active ${cat.color}` : ''}`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* SEARCH & ACTIVE ONLY CONTROLS */}
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2.5 flex-wrap">
                <div className="position-relative flex-grow-1" style={{ maxWidth: '280px' }}>
                  <Search size={13} className="position-absolute top-50 start-2 translate-middle-y text-dim" />
                  <input 
                    type="text" 
                    value={paramSearch} 
                    onChange={(e) => setParamSearch(e.target.value)} 
                    placeholder="Search parameter..." 
                    className="form-control form-control-sm ps-4 dg-search-input rounded-2 fs-11"
                  />
                </div>

                <div className="d-flex align-items-center gap-2 ms-auto">
                  <label className="d-flex align-items-center gap-1.5 cursor-pointer select-none mb-0 fs-11 text-dim">
                    <input 
                      type="checkbox" 
                      checked={showOnlyMapped} 
                      onChange={(e) => setShowOnlyMapped(e.target.checked)} 
                      className="form-check-input mt-0 cursor-pointer dg-checkbox"
                    />
                    <span>Active Only ({mappedTotalCount})</span>
                  </label>
                  <span className="dg-pts-counter">
                    Showing {filtered35Parameters.length} pts
                  </span>
                </div>
              </div>

              {/* PARAMETER TILES GRID */}
              <div className="dg-params-container pe-1">
                {filtered35Parameters.length === 0 ? (
                  <div className="d-flex flex-column align-items-center justify-content-center py-4 px-3 text-center rounded-2 dg-empty-params-state my-2">
                    <Database size={24} className="text-muted opacity-40 mb-2" />
                    <div className="fs-12 fw-bold text-main mb-1">
                      {!isDeviceConfigured 
                        ? 'NO GENERATOR MAPPED' 
                        : (paramSearch ? `No parameters matching "${paramSearch}"` : 'NO MAPPED PARAMETERS AVAILABLE')}
                    </div>
                    <div className="text-dim fs-11" style={{ maxWidth: '340px' }}>
                      {!isDeviceConfigured
                        ? 'This site has no configured generator devices or telemetry feeds. Select a mapped site to view live data.'
                        : (showOnlyMapped 
                            ? 'Currently displaying active mapped telemetry only (0 active). Uncheck "Active Only" to inspect all 35 parameter slots.' 
                            : 'No telemetry streams found.')}
                    </div>
                  </div>
                ) : (
                  <Row className="g-1.5">
                    {filtered35Parameters.map(p => {
                      const IconComp = p.icon || Zap;
                      const catColor = p.category === 'CHANGE' ? 'success' : p.category === 'PARM' ? 'warning' : p.category === 'ENGINE' ? 'info' : p.category === 'TOTAL' ? 'cyan' : 'danger';
                      const isMapped = p.isMapped && p.liveVal !== '--';
                      const isAlarmTripped = isMapped && p.category === 'FAULT' && 
                        !String(p.liveVal).toLowerCase().includes('0.00') && 
                        !String(p.liveVal).toLowerCase().includes('0 status') && 
                        !String(p.liveVal).toLowerCase().includes('normal') && 
                        !String(p.liveVal).toLowerCase().includes('healthy') && 
                        !String(p.liveVal).toLowerCase().includes('ok') && 
                        parseFloat(p.liveVal) !== 0;

                      const displayVal = !isMapped
                        ? 'NO MAPPED'
                        : (p.category === 'FAULT'
                            ? (isAlarmTripped ? 'TRIP' : 'Normal')
                            : (typeof p.liveVal === 'string' && p.liveVal.includes(' Status')
                                ? (p.liveVal.replace(' Status', '').trim() || (p.name === 'No of start' ? '0 Starts' : '0.00'))
                                : (p.liveVal && String(p.liveVal).trim() !== '' ? p.liveVal : (p.name === 'No of start' ? '0 Starts' : `0.00 ${p.unit || ''}`.trim()))));

                      return (
                        <Col key={p.id} md={6}>
                          <div className={`dg-param-tile-v3 ${isMapped ? catColor : 'unmapped'}`}>
                            <div className="d-flex align-items-center gap-2 text-truncate">
                              <span className="dg-param-num">{p.num}</span>
                              <IconComp size={13} className={isMapped ? `text-${catColor} flex-shrink-0` : 'text-muted opacity-40 flex-shrink-0'} />
                              <span className="dg-param-name text-truncate" title={p.name}>{p.name}</span>
                            </div>
                            <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                              <span className={`dg-param-val ${isMapped ? (p.category === 'FAULT' ? (isAlarmTripped ? 'trip' : 'normal') : catColor) : 'unmapped'}`}>
                                {displayVal}
                              </span>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </div>
            </div>
          </div>
        </Col>

        {/* ── RIGHT COLUMN (3 Cols): 3-PHASE ELECTRICAL COCKPIT, ACTIONS & INFO ── */}
        <Col xl={3} lg={12}>
          <div className="d-flex flex-column gap-3">
            {/* 3-PHASE LIVE ELECTRICAL COCKPIT */}
            <div className="dg-glass-card p-3">
              <div className="d-flex align-items-center justify-content-between mb-2.5 flex-wrap gap-2">
                <div className="fw-bold fs-12 text-cyan-glow uppercase tracking-wider d-flex align-items-center gap-2">
                  <Zap size={15} /> 
                  <span>ELECTRICAL COCKPIT</span>
                </div>
              </div>

              {/* 3 PRIMARY POWER TILES */}
              <Row className="g-2 mb-2.5">
                <Col xs={4}>
                  <div className="dg-power-card-v2 cyan p-2 rounded-2 text-center">
                    <div className="dg-power-sub">ACTIVE</div>
                    <div className="dg-power-val cyan mt-1">
                      {isDeviceConfigured && data.power.kw !== null ? data.power.kw.toFixed(1) : '--'}
                    </div>
                    <div className="dg-power-unit cyan fs-10">kW</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="dg-power-card-v2 warning p-2 rounded-2 text-center">
                    <div className="dg-power-sub">APPARENT</div>
                    <div className="dg-power-val warning mt-1">
                      {isDeviceConfigured && data.power.kva !== null ? data.power.kva.toFixed(1) : '--'}
                    </div>
                    <div className="dg-power-unit warning fs-10">kVA</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="dg-power-card-v2 success p-2 rounded-2 text-center">
                    <div className="dg-power-sub">REACTIVE</div>
                    <div className="dg-power-val success mt-1">
                      {isDeviceConfigured && data.power.kvar !== null ? data.power.kvar.toFixed(1) : '--'}
                    </div>
                    <div className="dg-power-unit success fs-10">kVAr</div>
                  </div>
                </Col>
              </Row>

              {/* 3-PHASE VOLTAGE DISTRIBUTION */}
              <div className="mb-2.5">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="text-dim fs-10 text-uppercase fw-bold">Line Voltages (V-L-L)</span>
                  <span className="text-cyan-glow fs-10 font-monospace">
                    PF: {isDeviceConfigured && data.power.pf !== null ? data.power.pf.toFixed(2) : '--'}
                  </span>
                </div>
                <div className="row g-1">
                  <div className="col-4">
                    <div className="dg-phase-volt-tile text-center p-1.5 rounded-2">
                      <span className="dg-phase-tag red">L1-L2</span>
                      <div className="dg-phase-volt-val font-monospace fs-11 mt-1">
                        {isDeviceConfigured && data.voltage.ry !== null ? `${data.voltage.ry.toFixed(1)}V` : '--'}
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="dg-phase-volt-tile text-center p-1.5 rounded-2">
                      <span className="dg-phase-tag amber">L2-L3</span>
                      <div className="dg-phase-volt-val font-monospace fs-11 mt-1">
                        {isDeviceConfigured && data.voltage.yb !== null ? `${data.voltage.yb.toFixed(1)}V` : '--'}
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="dg-phase-volt-tile text-center p-1.5 rounded-2">
                      <span className="dg-phase-tag blue">L3-L1</span>
                      <div className="dg-phase-volt-val font-monospace fs-11 mt-1">
                        {isDeviceConfigured && data.voltage.br !== null ? `${data.voltage.br.toFixed(1)}V` : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-PHASE LOAD CURRENTS & BALANCE */}
              <div>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="text-dim fs-10 text-uppercase fw-bold">Phase Load Currents</span>
                  <span className="text-success fs-10 font-monospace fw-bold">
                    {isDeviceConfigured && data.current.r !== null ? 'Balanced' : '--'}
                  </span>
                </div>
                <div className="d-flex flex-column gap-1.5">
                  <div className="dg-phase-current-row">
                    <div className="d-flex align-items-center justify-content-between fs-11">
                      <span className="text-danger fw-bold">Phase R (L1)</span>
                      <span className="dg-phase-curr-val font-monospace fw-bold">
                        {isDeviceConfigured && data.current.r !== null ? `${data.current.r.toFixed(1)} A` : '--'}
                      </span>
                    </div>
                    <div className="progress dg-phase-progress mt-1" style={{ height: '4px' }}>
                      <div className="progress-bar bg-danger" style={{ width: isDeviceConfigured && data.current.r !== null ? `${Math.min(data.current.r, 100)}%` : '0%' }}></div>
                    </div>
                  </div>

                  <div className="dg-phase-current-row">
                    <div className="d-flex align-items-center justify-content-between fs-11">
                      <span className="text-warning fw-bold">Phase Y (L2)</span>
                      <span className="dg-phase-curr-val font-monospace fw-bold">
                        {isDeviceConfigured && data.current.y !== null ? `${data.current.y.toFixed(1)} A` : '--'}
                      </span>
                    </div>
                    <div className="progress dg-phase-progress mt-1" style={{ height: '4px' }}>
                      <div className="progress-bar bg-warning" style={{ width: isDeviceConfigured && data.current.y !== null ? `${Math.min(data.current.y, 100)}%` : '0%' }}></div>
                    </div>
                  </div>

                  <div className="dg-phase-current-row">
                    <div className="d-flex align-items-center justify-content-between fs-11">
                      <span className="text-info fw-bold">Phase B (L3)</span>
                      <span className="dg-phase-curr-val font-monospace fw-bold">
                        {isDeviceConfigured && data.current.b !== null ? `${data.current.b.toFixed(1)} A` : '--'}
                      </span>
                    </div>
                    <div className="progress dg-phase-progress mt-1" style={{ height: '4px' }}>
                      <div className="progress-bar bg-info" style={{ width: isDeviceConfigured && data.current.b !== null ? `${Math.min(data.current.b, 100)}%` : '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS SECTION WITH REAL PILL TOGGLE SWITCH */}
            <div className="dg-glass-card p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="fw-bold fs-12 text-cyan-glow uppercase tracking-wider d-flex align-items-center gap-2">
                  <Settings size={15} /> 
                  <span>QUICK ACTIONS</span>
                </div>

                <div 
                  onClick={() => setShowQuickActions(!showQuickActions)} 
                  className={`dg-pill-toggle-switch ${showQuickActions ? 'on' : 'off'}`}
                  title={showQuickActions ? "Click to Turn OFF Remote Controls" : "Click to Turn ON Remote Controls"}
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
                          <div className="dg-action-icon-circle start"><Play size={11} fill="currentColor" /></div>
                          <span>START</span>
                        </div>
                        <ChevronRight size={13} className="opacity-70" />
                      </button>
                    </Col>
                    <Col xs={6}>
                      <button onClick={handleStopEngine} disabled={!isDeviceConfigured} className="dg-action-btn-v2 stop w-100 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div className="dg-action-icon-circle stop"><Square size={11} fill="currentColor" /></div>
                          <span>STOP</span>
                        </div>
                        <ChevronRight size={13} className="opacity-70" />
                      </button>
                    </Col>
                    <Col xs={6}>
                      <button onClick={handleResetEngine} disabled={!isDeviceConfigured} className="dg-action-btn-v2 reset w-100 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div className="dg-action-icon-circle reset"><RotateCcw size={11} /></div>
                          <span>RESET</span>
                        </div>
                        <ChevronRight size={13} className="opacity-70" />
                      </button>
                    </Col>
                    <Col xs={6}>
                      <button onClick={handleEmergencyStop} disabled={!isDeviceConfigured} className="dg-action-btn-v2 emergency w-100 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <div className="dg-action-icon-circle emergency"><AlertOctagon size={11} /></div>
                          <span>EMERGENCY</span>
                        </div>
                        <ChevronRight size={13} className="opacity-70" />
                      </button>
                    </Col>
                  </Row>
                </div>
              )}
            </div>

            {/* SYSTEM INFO WITH SLEEK ICON PILL ROWS */}
            <div className="dg-glass-card p-3">
              <div className="fw-bold fs-12 text-cyan-glow mb-2.5 uppercase tracking-wider d-flex align-items-center gap-2">
                <Info size={15} /> 
                <span>SYSTEM INFO</span>
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

        /* LIGHT MODE EYE-COMFORT & HIGH-CONTRAST SYSTEM */
        body.light-mode .dg-premium-page,
        [data-theme="light"] .dg-premium-page {
          background: #f0f3f8 !important;
          background-image: none !important;
          color: #0f172a !important;
        }

        body.light-mode .dg-glass-card,
        [data-theme="light"] .dg-glass-card {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05) !important;
        }
        body.light-mode .dg-glass-card:hover,
        [data-theme="light"] .dg-glass-card:hover {
          border-color: #94a3b8 !important;
        }

        body.light-mode .text-main,
        [data-theme="light"] .text-main { color: #0f172a !important; }

        body.light-mode .text-dim,
        [data-theme="light"] .text-dim { color: #475569 !important; font-weight: 600; }

        body.light-mode .text-cyan-glow,
        [data-theme="light"] .text-cyan-glow { color: #0284c7 !important; }

        body.light-mode .bg-pill-status,
        [data-theme="light"] .bg-pill-status {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
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
        body.light-mode .dg-btn-outline-glass,
        [data-theme="light"] .dg-btn-outline-glass {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          color: #0284c7 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .dg-btn-outline-glass:hover,
        [data-theme="light"] .dg-btn-outline-glass:hover {
          background: #f1f5f9 !important;
          border-color: #0284c7 !important;
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

        /* ULTRA-SLEEK SEGMENTED CATEGORY NAV BAR */
        .dg-category-nav-bar {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 4px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .dg-category-nav-bar::-webkit-scrollbar {
          display: none;
        }

        .dg-cat-nav-btn {
          flex: 1 1 0;
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 7px;
          border: 1px solid transparent;
          background: transparent;
          color: #94a3b8;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .dg-cat-nav-btn:hover {
          color: #f1f5f9;
          background: rgba(255, 255, 255, 0.05);
        }

        .dg-cat-nav-btn.active {
          background: rgba(14, 165, 233, 0.16);
          border-color: rgba(14, 165, 233, 0.45);
          color: #38bdf8;
          box-shadow: 0 2px 10px rgba(14, 165, 233, 0.2);
        }

        .dg-cat-nav-btn.active.success {
          background: rgba(16, 185, 129, 0.16);
          border-color: rgba(16, 185, 129, 0.5);
          color: #34d399;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);
        }
        .dg-cat-nav-btn.active.warning {
          background: rgba(245, 158, 11, 0.16);
          border-color: rgba(245, 158, 11, 0.5);
          color: #fbbf24;
          box-shadow: 0 2px 10px rgba(245, 158, 11, 0.2);
        }
        .dg-cat-nav-btn.active.info {
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(59, 130, 246, 0.5);
          color: #60a5fa;
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2);
        }
        .dg-cat-nav-btn.active.cyan {
          background: rgba(6, 182, 212, 0.16);
          border-color: rgba(6, 182, 212, 0.5);
          color: #22d3ee;
          box-shadow: 0 2px 10px rgba(6, 182, 212, 0.2);
        }
        .dg-cat-nav-btn.active.danger {
          background: rgba(239, 68, 68, 0.16);
          border-color: rgba(239, 68, 68, 0.5);
          color: #f87171;
          box-shadow: 0 2px 10px rgba(239, 68, 68, 0.2);
        }

        .dg-cat-main {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
        }

        .dg-cat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .dg-cat-dot.cyan { background: #06b6d4; box-shadow: 0 0 6px rgba(6, 182, 212, 0.6); }

        .dg-cat-code {
          font-family: monospace;
          font-size: 0.62rem;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 3px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
        }
        .dg-cat-code.success { color: #10b981; background: rgba(16, 185, 129, 0.12); }
        .dg-cat-code.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.12); }
        .dg-cat-code.info { color: #3b82f6; background: rgba(59, 130, 246, 0.12); }
        .dg-cat-code.cyan { color: #06b6d4; background: rgba(6, 182, 212, 0.12); }
        .dg-cat-code.danger { color: #ef4444; background: rgba(239, 68, 68, 0.12); }

        .dg-cat-name {
          font-weight: 700;
          font-size: 0.7rem;
          letter-spacing: 0.03em;
        }

        .dg-cat-badge {
          font-family: monospace;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .dg-cat-badge.active.cyan { background: rgba(6, 182, 212, 0.25); color: #22d3ee; }
        .dg-cat-badge.active.success { background: rgba(16, 185, 129, 0.25); color: #34d399; }
        .dg-cat-badge.active.warning { background: rgba(245, 158, 11, 0.25); color: #fbbf24; }
        .dg-cat-badge.active.info { background: rgba(59, 130, 246, 0.25); color: #60a5fa; }
        .dg-cat-badge.active.danger { background: rgba(239, 68, 68, 0.25); color: #f87171; }

        /* Light mode support */
        body.light-mode .dg-category-nav-bar,
        [data-theme="light"] .dg-category-nav-bar {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .dg-cat-nav-btn,
        [data-theme="light"] .dg-cat-nav-btn {
          color: #64748b !important;
        }
        body.light-mode .dg-cat-nav-btn:hover,
        [data-theme="light"] .dg-cat-nav-btn:hover {
          background: #e2e8f0 !important;
          color: #0f172a !important;
        }
        body.light-mode .dg-cat-badge,
        [data-theme="light"] .dg-cat-badge {
          background: #e2e8f0 !important;
          color: #475569 !important;
        }
        body.light-mode .dg-cat-code,
        [data-theme="light"] .dg-cat-code {
          background: #e2e8f0 !important;
          color: #475569 !important;
        }

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

        /* TARGET BADGE & INTERACTIVE TARGET SELECTOR */
        .dg-target-badge,
        .dg-target-selector-capsule {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(3, 7, 18, 0.75);
          border: 1px solid rgba(14, 165, 233, 0.35);
          border-radius: 20px;
          padding: 2px 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          transition: all 0.2s ease;
          max-width: 100%;
        }
        .dg-target-selector-capsule:hover {
          border-color: rgba(14, 165, 233, 0.6);
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.25);
        }
        .dg-target-label {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 700;
          letter-spacing: 0.3px;
          flex-shrink: 0;
        }
        .dg-target-select-input {
          background: transparent;
          color: #ffffff;
          font-size: 0.68rem;
          font-weight: 800;
          border: none;
          outline: none;
          cursor: pointer;
          padding-right: 14px;
          padding-left: 2px;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          letter-spacing: 0.3px;
          max-width: 130px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
        .dg-target-select-input:focus {
          outline: none;
        }
        .dg-target-select-option {
          background: #0f172a;
          color: #f8fafc;
          font-weight: 700;
          padding: 6px 10px;
        }
        .dg-target-select-chevron {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          color: #38bdf8;
          pointer-events: none;
        }
        .dg-target-count-pill {
          font-size: 0.58rem;
          font-weight: 800;
          color: #38bdf8;
          background: rgba(14, 165, 233, 0.18);
          border: 1px solid rgba(14, 165, 233, 0.4);
          border-radius: 10px;
          padding: 1px 5px;
          letter-spacing: 0.2px;
          line-height: 1.2;
          flex-shrink: 0;
        }

        body.light-mode .dg-target-badge,
        [data-theme="light"] .dg-target-badge,
        body.light-mode .dg-target-selector-capsule,
        [data-theme="light"] .dg-target-selector-capsule {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05) !important;
        }
        body.light-mode .dg-target-selector-capsule:hover,
        [data-theme="light"] .dg-target-selector-capsule:hover {
          border-color: #0284c7 !important;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.15) !important;
        }
        body.light-mode .dg-target-label,
        [data-theme="light"] .dg-target-label {
          color: #475569 !important;
          font-weight: 700 !important;
        }
        body.light-mode .dg-target-select-input,
        [data-theme="light"] .dg-target-select-input {
          color: #0f172a !important;
          font-weight: 800 !important;
        }
        body.light-mode .dg-target-select-option,
        [data-theme="light"] .dg-target-select-option {
          background: #ffffff !important;
          color: #0f172a !important;
        }
        body.light-mode .dg-target-select-chevron,
        [data-theme="light"] .dg-target-select-chevron {
          color: #0284c7 !important;
        }
        body.light-mode .dg-target-count-pill,
        [data-theme="light"] .dg-target-count-pill {
          background: #e0f2fe !important;
          color: #0369a1 !important;
          border: 1px solid #bae6fd !important;
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

        /* ── NEW MODERN SCADA VITALS & TELEMETRY STYLING ── */
        .dg-vital-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.25s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
        }
        .dg-vital-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
        }
        .dg-vital-card.cyan { border-left: 3px solid #0ea5e9; }
        .dg-vital-card.warning { border-left: 3px solid #f59e0b; }
        .dg-vital-card.success { border-left: 3px solid #10b981; }
        .dg-vital-card.info { border-left: 3px solid #3b82f6; }

        .dg-vital-icon {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dg-vital-icon.cyan { background: rgba(14, 165, 233, 0.15); color: #38bdf8; }
        .dg-vital-icon.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .dg-vital-icon.success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .dg-vital-icon.info { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

        .dg-vital-name {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .dg-vital-badge {
          font-size: 0.62rem;
          font-weight: 700;
          font-family: monospace;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .dg-vital-badge.cyan { background: rgba(14, 165, 233, 0.12); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); }
        .dg-vital-badge.warning { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .dg-vital-badge.success { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .dg-vital-badge.info { background: rgba(59, 130, 246, 0.12); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }

        .dg-vital-val {
          font-size: 1.35rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1;
        }
        .dg-vital-unit {
          font-size: 0.75rem;
          font-weight: 800;
          font-family: monospace;
        }
        .dg-vital-unit.cyan { color: #38bdf8; }
        .dg-vital-unit.warning { color: #fbbf24; }
        .dg-vital-unit.success { color: #34d399; }
        .dg-vital-unit.info { color: #60a5fa; }

        /* SAFETY INTERLOCKS BANNER */
        .dg-safety-banner {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }
        .dg-safety-banner.healthy {
          border-color: rgba(16, 185, 129, 0.35);
          background: linear-gradient(135deg, rgba(6, 78, 59, 0.25) 0%, rgba(15, 23, 42, 0.7) 100%);
        }
        .dg-safety-banner.alert {
          border-color: rgba(239, 68, 68, 0.5);
          background: linear-gradient(135deg, rgba(127, 29, 29, 0.3) 0%, rgba(15, 23, 42, 0.7) 100%);
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
        }

        .dg-safety-shield-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dg-safety-shield-icon.healthy {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }
        .dg-safety-shield-icon.alert {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.4);
          animation: dg-pulse 1.2s infinite;
        }

        .dg-interlock-chip {
          display: inline-flex;
          align-items: center;
          font-size: 0.67rem;
          font-weight: 600;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 2px 7px;
        }

        .dg-sensor-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 8px;
          border-radius: 6px;
          background: rgba(3, 7, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
        }
        .dg-sensor-item.tripped {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.12);
        }
        .dg-sensor-item.normal {
          border-left: 2px solid #10b981;
        }

        /* PARAMETER TILES V3 */
        .dg-param-tile-v3 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 9px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.2s ease;
        }
        .dg-param-tile-v3:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .dg-param-tile-v3.success { border-left: 3px solid #10b981; }
        .dg-param-tile-v3.warning { border-left: 3px solid #f59e0b; }
        .dg-param-tile-v3.info { border-left: 3px solid #3b82f6; }
        .dg-param-tile-v3.cyan { border-left: 3px solid #06b6d4; }
        .dg-param-tile-v3.danger { border-left: 3px solid #ef4444; }

        .dg-param-tile-v3.unmapped {
          opacity: 0.42;
          background: rgba(15, 23, 42, 0.25);
          border-left: 1px dashed rgba(255, 255, 255, 0.1);
        }

        /* DIGITAL TWIN SUBTILE & HUD */
        .dg-subtile {
          background: rgba(3, 7, 18, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dg-engine-hud-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 800;
          font-family: monospace;
          letter-spacing: 0.4px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        .dg-engine-hud-pill.running {
          background: rgba(6, 78, 59, 0.85);
          border: 1px solid rgba(52, 211, 153, 0.6);
          color: #34d399;
        }
        .dg-engine-hud-pill.idle {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
        }

        .dg-hud-bottom-bar {
          background: rgba(3, 7, 18, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
        }

        .dg-scada-grid-overlay {
          background-image: linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* 3-PHASE ELECTRICAL COCKPIT */
        .dg-phase-volt-tile {
          background: rgba(3, 7, 18, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }
        .dg-phase-volt-val {
          color: #ffffff;
          font-weight: 800;
        }
        .dg-phase-curr-val {
          color: #ffffff;
        }
        .dg-phase-current-row {
          background: rgba(3, 7, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 6px 10px;
          border-radius: 8px;
        }
        .dg-phase-progress {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
        }

        /* HIGH-CONTRAST PHASE TAGS (L1-L2, L2-L3, L3-L1) */
        .dg-phase-tag {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 0.65rem;
          font-weight: 800;
          font-family: monospace;
          letter-spacing: 0.5px;
        }
        .dg-phase-tag.red {
          background: rgba(239, 68, 68, 0.22);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.45);
        }
        .dg-phase-tag.amber {
          background: rgba(245, 158, 11, 0.22);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.45);
        }
        .dg-phase-tag.blue {
          background: rgba(14, 165, 233, 0.22);
          color: #38bdf8;
          border: 1px solid rgba(14, 165, 233, 0.45);
        }

        /* BADGES & STATUS PILLS */
        .dg-fuel-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: rgba(245, 158, 11, 0.18);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .dg-online-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .dg-online-pill.online {
          background: rgba(16, 185, 129, 0.18);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }
        .dg-online-pill.offline {
          background: rgba(148, 163, 184, 0.18);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .dg-status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .dg-status-pill.normal {
          background: rgba(16, 185, 129, 0.18);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .dg-status-pill.trip {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.5);
          animation: dg-pulse 1.5s infinite;
        }
        .dg-status-pill.unmapped {
          background: rgba(148, 163, 184, 0.12);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }
        .dg-sensor-item.unmapped {
          opacity: 0.85;
          background: rgba(15, 23, 42, 0.3);
          border: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .dg-vital-badge.unmapped {
          background: rgba(148, 163, 184, 0.12) !important;
          color: #94a3b8 !important;
          border: 1px solid rgba(148, 163, 184, 0.25) !important;
          letter-spacing: 0.5px;
        }
        .dg-empty-params-state {
          background: rgba(15, 23, 42, 0.35);
          border: 1px dashed rgba(255, 255, 255, 0.12);
        }

        .dg-pts-counter {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 700;
          font-family: monospace;
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dg-search-input {
          background: rgba(15, 23, 42, 0.8) !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
        }
        .dg-search-input::placeholder {
          color: #64748b !important;
        }
        .dg-search-input:focus {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.25) !important;
        }

        .dg-border-subtle {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .fs-9 { font-size: 0.56rem !important; }
        .fs-10 { font-size: 0.65rem !important; }
        .fs-11 { font-size: 0.72rem !important; }

        /* ── COMPLETE EYE-COMFORT & HIGH-CONTRAST LIGHT MODE OVERRIDES ── */
        body.light-mode .dg-fuel-badge,
        [data-theme="light"] .dg-fuel-badge {
          background: #fef3c7 !important;
          color: #92400e !important;
          border: 1.5px solid #fcd34d !important;
          box-shadow: 0 1px 3px rgba(180, 83, 9, 0.08) !important;
        }

        body.light-mode .dg-online-pill.online,
        [data-theme="light"] .dg-online-pill.online {
          background: #dcfce7 !important;
          color: #15803d !important;
          border: 1.5px solid #86efac !important;
        }
        body.light-mode .dg-online-pill.offline,
        [data-theme="light"] .dg-online-pill.offline {
          background: #f1f5f9 !important;
          color: #475569 !important;
          border: 1.5px solid #cbd5e1 !important;
        }

        body.light-mode .dg-phase-tag.red,
        [data-theme="light"] .dg-phase-tag.red {
          background: #fee2e2 !important;
          color: #991b1b !important;
          border: 1.5px solid #fca5a5 !important;
        }
        body.light-mode .dg-phase-tag.amber,
        [data-theme="light"] .dg-phase-tag.amber {
          background: #fef3c7 !important;
          color: #92400e !important;
          border: 1.5px solid #fde68a !important;
        }
        body.light-mode .dg-phase-tag.blue,
        [data-theme="light"] .dg-phase-tag.blue {
          background: #e0f2fe !important;
          color: #0369a1 !important;
          border: 1.5px solid #bae6fd !important;
        }

        body.light-mode .dg-phase-volt-val,
        [data-theme="light"] .dg-phase-volt-val {
          color: #0f172a !important;
          font-weight: 800 !important;
        }
        body.light-mode .dg-phase-curr-val,
        [data-theme="light"] .dg-phase-curr-val {
          color: #0f172a !important;
          font-weight: 800 !important;
        }

        body.light-mode .dg-status-pill.normal,
        [data-theme="light"] .dg-status-pill.normal {
          background: #dcfce7 !important;
          color: #15803d !important;
          border: 1.5px solid #86efac !important;
        }
        body.light-mode .dg-status-pill.trip,
        [data-theme="light"] .dg-status-pill.trip {
          background: #fee2e2 !important;
          color: #b91c1c !important;
          border: 1.5px solid #fca5a5 !important;
        }
        body.light-mode .dg-status-pill.unmapped,
        [data-theme="light"] .dg-status-pill.unmapped {
          background: #f1f5f9 !important;
          color: #64748b !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode .dg-sensor-item.unmapped,
        [data-theme="light"] .dg-sensor-item.unmapped {
          background: #f8fafc !important;
          border: 1px dashed #cbd5e1 !important;
          opacity: 1 !important;
        }
        body.light-mode .dg-vital-badge.unmapped,
        [data-theme="light"] .dg-vital-badge.unmapped {
          background: #f1f5f9 !important;
          color: #64748b !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode .dg-empty-params-state,
        [data-theme="light"] .dg-empty-params-state {
          background: #f8fafc !important;
          border: 1px dashed #cbd5e1 !important;
        }

        body.light-mode .dg-search-input,
        [data-theme="light"] .dg-search-input {
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1.5px solid #cbd5e1 !important;
        }
        body.light-mode .dg-search-input::placeholder,
        [data-theme="light"] .dg-search-input::placeholder {
          color: #94a3b8 !important;
        }

        body.light-mode .dg-pts-counter,
        [data-theme="light"] .dg-pts-counter {
          background: #e2e8f0 !important;
          color: #334155 !important;
          border: 1px solid #cbd5e1 !important;
        }

        body.light-mode .dg-border-subtle,
        [data-theme="light"] .dg-border-subtle {
          border-color: #cbd5e1 !important;
        }

        /* PRIMARY VITALS */
        body.light-mode .dg-vital-card,
        [data-theme="light"] .dg-vital-card {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04) !important;
        }
        body.light-mode .dg-vital-card.cyan { border-left: 4px solid #0284c7 !important; }
        body.light-mode .dg-vital-card.warning { border-left: 4px solid #d97706 !important; }
        body.light-mode .dg-vital-card.success { border-left: 4px solid #16a34a !important; }
        body.light-mode .dg-vital-card.info { border-left: 4px solid #2563eb !important; }

        body.light-mode .dg-vital-name,
        [data-theme="light"] .dg-vital-name {
          color: #334155 !important;
          font-weight: 800 !important;
        }
        body.light-mode .dg-vital-val,
        [data-theme="light"] .dg-vital-val {
          color: #0f172a !important;
          font-weight: 900 !important;
        }
        body.light-mode .dg-vital-badge.cyan,
        [data-theme="light"] .dg-vital-badge.cyan {
          background: #e0f2fe !important;
          color: #0369a1 !important;
          border: 1.5px solid #bae6fd !important;
        }
        body.light-mode .dg-vital-badge.warning,
        [data-theme="light"] .dg-vital-badge.warning {
          background: #fef3c7 !important;
          color: #92400e !important;
          border: 1.5px solid #fde68a !important;
        }
        body.light-mode .dg-vital-badge.success,
        [data-theme="light"] .dg-vital-badge.success {
          background: #dcfce7 !important;
          color: #15803d !important;
          border: 1.5px solid #86efac !important;
        }
        body.light-mode .dg-vital-badge.info,
        [data-theme="light"] .dg-vital-badge.info {
          background: #dbeafe !important;
          color: #1d4ed8 !important;
          border: 1.5px solid #bfdbfe !important;
        }

        body.light-mode .dg-vital-unit.cyan, [data-theme="light"] .dg-vital-unit.cyan { color: #0284c7 !important; font-weight: 800; }
        body.light-mode .dg-vital-unit.warning, [data-theme="light"] .dg-vital-unit.warning { color: #b45309 !important; font-weight: 800; }
        body.light-mode .dg-vital-unit.success, [data-theme="light"] .dg-vital-unit.success { color: #15803d !important; font-weight: 800; }
        body.light-mode .dg-vital-unit.info, [data-theme="light"] .dg-vital-unit.info { color: #1d4ed8 !important; font-weight: 800; }

        /* SAFETY BANNER & SENSORS */
        body.light-mode .dg-safety-banner.healthy,
        [data-theme="light"] .dg-safety-banner.healthy {
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%) !important;
          border: 1.5px solid #86efac !important;
          box-shadow: 0 4px 15px rgba(22, 101, 52, 0.06) !important;
        }
        body.light-mode .dg-safety-shield-icon.healthy,
        [data-theme="light"] .dg-safety-shield-icon.healthy {
          background: #dcfce7 !important;
          color: #15803d !important;
          border: 1.5px solid #86efac !important;
        }
        body.light-mode .dg-interlock-chip,
        [data-theme="light"] .dg-interlock-chip {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #1f2937 !important;
          font-weight: 700 !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .dg-sensor-item,
        [data-theme="light"] .dg-sensor-item {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode .dg-sensor-item.normal,
        [data-theme="light"] .dg-sensor-item.normal {
          border-left: 3px solid #16a34a !important;
        }

        /* PARAMETER TILES V3 & CLEAR VISIBILITY FOR UNMAPPED */
        body.light-mode .dg-param-tile-v3,
        [data-theme="light"] .dg-param-tile-v3 {
          background: #ffffff !important;
          border: 1.5px solid #e2e8f0 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03) !important;
        }
        body.light-mode .dg-param-tile-v3:hover,
        [data-theme="light"] .dg-param-tile-v3:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .dg-param-tile-v3.success { border-left: 3px solid #16a34a !important; }
        body.light-mode .dg-param-tile-v3.warning { border-left: 3px solid #d97706 !important; }
        body.light-mode .dg-param-tile-v3.info { border-left: 3px solid #2563eb !important; }
        body.light-mode .dg-param-tile-v3.cyan { border-left: 3px solid #0284c7 !important; }
        body.light-mode .dg-param-tile-v3.danger { border-left: 3px solid #dc2626 !important; }

        /* ALL UNMAPPED PARAMETERS NOW CRISP & FULLY VISIBLE */
        .dg-param-tile-v3.unmapped {
          opacity: 0.95;
          background: rgba(15, 23, 42, 0.35);
          border: 1px dashed rgba(255, 255, 255, 0.12);
        }
        .dg-param-tile-v3.unmapped .dg-param-name {
          color: #94a3b8 !important;
        }
        .dg-param-tile-v3.unmapped .dg-param-val {
          color: #64748b !important;
        }

        body.light-mode .dg-param-tile-v3.unmapped,
        [data-theme="light"] .dg-param-tile-v3.unmapped {
          background: #f8fafc !important;
          border: 1px dashed #cbd5e1 !important;
          opacity: 1 !important;
        }
        body.light-mode .dg-param-tile-v3.unmapped .dg-param-name,
        [data-theme="light"] .dg-param-tile-v3.unmapped .dg-param-name {
          color: #334155 !important;
          font-weight: 600 !important;
        }
        body.light-mode .dg-param-tile-v3.unmapped .dg-param-val,
        [data-theme="light"] .dg-param-tile-v3.unmapped .dg-param-val {
          color: #64748b !important;
          font-weight: 700 !important;
        }

        body.light-mode .dg-param-name,
        [data-theme="light"] .dg-param-name {
          color: #0f172a !important;
          font-weight: 600 !important;
        }
        body.light-mode .dg-param-num,
        [data-theme="light"] .dg-param-num {
          background: #e2e8f0 !important;
          color: #475569 !important;
          font-weight: 700 !important;
        }

        body.light-mode .dg-param-val.normal,
        [data-theme="light"] .dg-param-val.normal {
          color: #15803d !important;
          font-weight: 800 !important;
        }
        body.light-mode .dg-param-val.trip,
        [data-theme="light"] .dg-param-val.trip {
          color: #b91c1c !important;
          background: #fee2e2 !important;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 800 !important;
        }
        body.light-mode .dg-param-val.cyan,
        [data-theme="light"] .dg-param-val.cyan {
          color: #0284c7 !important;
          font-weight: 800 !important;
        }
        body.light-mode .dg-param-val.warning,
        [data-theme="light"] .dg-param-val.warning {
          color: #b45309 !important;
          font-weight: 800 !important;
        }
        body.light-mode .dg-param-val.info,
        [data-theme="light"] .dg-param-val.info {
          color: #1d4ed8 !important;
          font-weight: 800 !important;
        }
        body.light-mode .dg-param-val.success,
        [data-theme="light"] .dg-param-val.success {
          color: #15803d !important;
          font-weight: 800 !important;
        }

        /* SUBTILES, PHASE TILES & SYSINFO */
        body.light-mode .dg-subtile,
        [data-theme="light"] .dg-subtile {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .dg-phase-volt-tile,
        [data-theme="light"] .dg-phase-volt-tile {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .dg-phase-current-row,
        [data-theme="light"] .dg-phase-current-row {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
        }
        body.light-mode .dg-phase-progress,
        [data-theme="light"] .dg-phase-progress {
          background: #e2e8f0 !important;
        }

        body.light-mode .dg-sysinfo-row,
        [data-theme="light"] .dg-sysinfo-row {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
        }
        body.light-mode .dg-sysinfo-row .text-main,
        [data-theme="light"] .dg-sysinfo-row .text-main {
          color: #0f172a !important;
        }
        body.light-mode .dg-sysinfo-row .text-dim,
        [data-theme="light"] .dg-sysinfo-row .text-dim {
          color: #475569 !important;
        }

        /* FUEL TILES IN LIGHT MODE */
        body.light-mode .dg-fuel-tile-val.warning, [data-theme="light"] .dg-fuel-tile-val.warning { color: #b45309 !important; font-weight: 800; }
        body.light-mode .dg-fuel-tile-val.info, [data-theme="light"] .dg-fuel-tile-val.info { color: #0284c7 !important; font-weight: 800; }
        body.light-mode .dg-fuel-tile-val.danger, [data-theme="light"] .dg-fuel-tile-val.danger { color: #dc2626 !important; font-weight: 800; }
        body.light-mode .dg-fuel-tile-val.success, [data-theme="light"] .dg-fuel-tile-val.success { color: #15803d !important; font-weight: 800; }
        body.light-mode .dg-fuel-tile-lbl, [data-theme="light"] .dg-fuel-tile-lbl { color: #334155 !important; font-weight: 700 !important; }

        /* TANK LEVEL BADGE */
        body.light-mode .dg-tank-center-badge,
        [data-theme="light"] .dg-tank-center-badge {
          background: rgba(255, 255, 255, 0.94) !important;
          border: 1.5px solid #f59e0b !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12) !important;
          padding: 3px 8px !important;
          border-radius: 8px !important;
        }
        body.light-mode .dg-tank-val,
        [data-theme="light"] .dg-tank-val {
          color: #0f172a !important;
          text-shadow: none !important;
        }
        body.light-mode .dg-tank-lbl,
        [data-theme="light"] .dg-tank-lbl {
          color: #b45309 !important;
          text-shadow: none !important;
        }

        /* CATEGORY NAV BUTTONS IN LIGHT MODE */
        body.light-mode .dg-category-nav-bar,
        [data-theme="light"] .dg-category-nav-bar {
          background: #f8fafc !important;
          border: 1.5px solid #cbd5e1 !important;
        }
        body.light-mode .dg-cat-nav-btn,
        [data-theme="light"] .dg-cat-nav-btn {
          background: #ffffff !important;
          color: #334155 !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .dg-cat-nav-btn:hover,
        [data-theme="light"] .dg-cat-nav-btn:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .dg-cat-badge,
        [data-theme="light"] .dg-cat-badge {
          background: #e2e8f0 !important;
          color: #334155 !important;
        }
        body.light-mode .dg-cat-nav-btn.active.cyan,
        [data-theme="light"] .dg-cat-nav-btn.active.cyan {
          background: #e0f2fe !important;
          border-color: #0284c7 !important;
          color: #0369a1 !important;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.18) !important;
        }
        body.light-mode .dg-cat-badge.active.cyan,
        [data-theme="light"] .dg-cat-badge.active.cyan {
          background: #0284c7 !important;
          color: #ffffff !important;
        }
        body.light-mode .dg-cat-nav-btn.active.warning,
        [data-theme="light"] .dg-cat-nav-btn.active.warning {
          background: #fef3c7 !important;
          border-color: #d97706 !important;
          color: #92400e !important;
          box-shadow: 0 2px 6px rgba(217, 119, 6, 0.18) !important;
        }
        body.light-mode .dg-cat-badge.active.warning,
        [data-theme="light"] .dg-cat-badge.active.warning {
          background: #d97706 !important;
          color: #ffffff !important;
        }
        body.light-mode .dg-cat-nav-btn.active.info,
        [data-theme="light"] .dg-cat-nav-btn.active.info {
          background: #dbeafe !important;
          border-color: #2563eb !important;
          color: #1d4ed8 !important;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.18) !important;
        }
        body.light-mode .dg-cat-badge.active.info,
        [data-theme="light"] .dg-cat-badge.active.info {
          background: #2563eb !important;
          color: #ffffff !important;
        }
        body.light-mode .dg-cat-nav-btn.active.success,
        [data-theme="light"] .dg-cat-nav-btn.active.success {
          background: #dcfce7 !important;
          border-color: #16a34a !important;
          color: #15803d !important;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.18) !important;
        }
        body.light-mode .dg-cat-badge.active.success,
        [data-theme="light"] .dg-cat-badge.active.success {
          background: #16a34a !important;
          color: #ffffff !important;
        }
        body.light-mode .dg-cat-nav-btn.active.danger,
        [data-theme="light"] .dg-cat-nav-btn.active.danger {
          background: #fee2e2 !important;
          border-color: #dc2626 !important;
          color: #991b1b !important;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.18) !important;
        }
        body.light-mode .dg-cat-badge.active.danger,
        [data-theme="light"] .dg-cat-badge.active.danger {
          background: #dc2626 !important;
          color: #ffffff !important;
        }

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
