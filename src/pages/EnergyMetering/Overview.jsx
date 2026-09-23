import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Badge, Table, Modal, Form, Button } from 'react-bootstrap';
import {
  Zap,
  Activity,
  Gauge,
  Layers3,
  FolderTree,
  Network,
  Settings2,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  Sun,
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Radio,
  Sparkles,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import SolarDashboard from './SolarDashboard';
import {
  PARAMETER_SYNONYMS,
  formatNumber,
  MAIN_METER_FIELDS_METADATA
} from './utils/energyTelemetry';
import {
  useMeterGroups,
  GROUP_COLORS,
  createGroupId
} from './hooks/useMeterGroups';

const parseNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatMetric = (value, digits = 1) => parseNumber(value, 0).toFixed(digits);

const CATEGORY_COLORS = {
  Commercial: '#38bdf8',
  'Data Center': '#fb923c',
  'Water Management': '#22c55e',
  VRV: '#f87171',
  Lighting: '#a78bfa',
  'Sub Meter': '#94a3b8',
  Ungrouped: '#facc15'
};

const getCategoryColor = (category) => {
  if (!category) return '#94a3b8';
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
};

const resolveSubMeterCategory = (template) => {
  const targetName = String(template?.mapping?.energyMeteringTarget || template?.name || '').toUpperCase();
  const mappedCategory = template?.mapping?.subMeterCategory || template?.category;
  if (mappedCategory) return mappedCategory;
  if (targetName.includes('COMMERCIAL') || targetName.includes('WING') || targetName.includes('OFFICE')) return 'Commercial';
  if (targetName.includes('SERVER') || targetName.includes('UPS') || targetName.includes('DATA CENTER') || targetName.includes('IT')) return 'Data Center';
  if (targetName.includes('WATER') || targetName.includes('PLANT') || targetName.includes('UTILITY') || targetName.includes('MOTOR') || targetName.includes('PUMP')) return 'Water Management';
  if (targetName.includes('VRV') || targetName.includes('CHILLER') || targetName.includes('AC')) return 'VRV';
  if (targetName.includes('LIGHT') || targetName.includes('STREET') || targetName.includes('PARKING')) return 'Lighting';
  return 'Sub Meter';
};

const EnergyMeteringOverview = () => {
  const navigate = useNavigate();
  const { getOverallStatus } = useDeviceStatus();

  const [templates, setTemplates] = useState([]);
  const [telemetryStats, setTelemetryStats] = useState([]);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [groupDrafts, setGroupDrafts] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('Settings saved successfully');
  const [groupActionStatus, setGroupActionStatus] = useState(null);
  const [showGroups, setShowGroups] = useState(true);
  const [viewMode, setViewMode] = useState('solar'); // 'solar' | 'overview'

  const refreshTemplates = () => {
    try {
      const raw = localStorage.getItem('scada_templates');
      setTemplates(raw ? JSON.parse(raw) : []);
    } catch (error) {
      console.error('Failed to parse templates:', error);
      setTemplates([]);
    }
  };

  useEffect(() => {
    refreshTemplates();
    let active = true;

    const fetchTemplatesFromBackend = async () => {
      try {
        const res = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates`);
        if (!res.ok) return;
        const data = await res.json();
        const mapped = data.map(t => {
          const hasDef = t.defaultValues && typeof t.defaultValues === 'object' && Object.keys(t.defaultValues).length > 0;
          const defValues = hasDef ? t.defaultValues : null;
          const mappingSource = defValues || t.settings?.[0]?.meta || {};
          return {
            id: t.id,
            name: t.name,
            category: (defValues && defValues.category) || t.category || 'Water Management',
            module: (defValues && defValues.module) || t.settings?.[0]?.eventKey || 'AG Tank',
            mapping: mappingSource
          };
        });
        if (active) {
          setTemplates(mapped);
          localStorage.setItem('scada_templates', JSON.stringify(mapped));
        }
      } catch (err) {
        console.error('Error fetching templates in Overview:', err);
      }
    };

    fetchTemplatesFromBackend();

    const syncState = () => refreshTemplates();
    window.addEventListener('storage', syncState);
    window.addEventListener('storage-update', syncState);
    return () => {
      active = false;
      window.removeEventListener('storage', syncState);
      window.removeEventListener('storage-update', syncState);
    };
  }, []);

  useEffect(() => {
    const backendUrl = window.process?.env?.REACT_APP_BACKEND_URL || '';
    const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'], autoConnect: false });

    const processTelemetry = (stats) => {
      if (!Array.isArray(stats)) return;
      setTelemetryStats(prev => {
        const validPrev = (Array.isArray(prev) ? prev : []).filter(Boolean);
        const map = new Map(validPrev.map(item => [String(item.moduleId || item.meta?.module_id), item]));
        stats.forEach(item => {
          if (item) {
            const id = String(item.moduleId || item.meta?.module_id);
            if (id) map.set(id, item);
          }
        });
        const merged = Array.from(map.values());
        try {
          localStorage.setItem('scada_energy_overview_cache', JSON.stringify(merged));
        } catch (error) {
          console.error('Failed to cache overview telemetry:', error);
        }
        return merged;
      });
    };

    socket.on('telemetry_update', processTelemetry);

    try {
      const cached = localStorage.getItem('scada_energy_overview_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setTelemetryStats(parsed.filter(Boolean));
      }
    } catch (error) {
      console.error('Failed to load cached telemetry:', error);
    }

    const fetchStats = async () => {
      try {
        const modulesToPoll = new Set();
        if (Array.isArray(templates)) {
          templates.forEach(template => {
            if (!template.mapping) return;
            Object.values(template.mapping).forEach(cfg => {
              if (cfg && typeof cfg === 'object' && cfg.module && cfg.module !== 'ALL') {
                modulesToPoll.add(String(cfg.module));
              }
            });
          });
        }

        const pollList = Array.from(modulesToPoll);
        if (!pollList.length) return;

        const url = `${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/stats?modules=${pollList.join(',')}`;
        const res = await fetch(url);
        if (res.ok) {
          processTelemetry(await res.json());
        }
      } catch (error) {
        console.error('Error in overview fetchStats:', error);
      }
    };

    fetchStats();
    const pollingInterval = setInterval(fetchStats, 3000);
    return () => {
      socket.disconnect();
      clearInterval(pollingInterval);
    };
  }, [templates]);

  const getTelemetryValue = (template, sectionKey, fieldKey) => {
    if (!template?.mapping?.[sectionKey]) return null;
    const config = template.mapping[sectionKey];
    if (config.enabled === false) return null;
    const fieldVal = config[fieldKey];
    if (!fieldVal) return null;

    let targetModuleId = config.module;
    let cleanKey = fieldVal;

    if (typeof fieldVal === 'string' && fieldVal.includes('::')) {
      const parts = fieldVal.split('::');
      targetModuleId = parts[0];
      cleanKey = parts[1];
    } else if (typeof fieldVal === 'string' && fieldVal.includes(':')) {
      const parts = fieldVal.split(':');
      targetModuleId = parts[0];
      cleanKey = parts.pop();
    }

    const stat = telemetryStats.find(
      item => item && (String(item.moduleId) === String(targetModuleId) || String(item.meta?.module_id) === String(targetModuleId))
    );

    if (!stat || !stat.meta) return null;

    if (cleanKey && stat.meta[cleanKey] !== undefined) return stat.meta[cleanKey];
    if (stat.meta[fieldVal] !== undefined) return stat.meta[fieldVal];

    const synonyms = PARAMETER_SYNONYMS[fieldKey] || [];
    for (const sym of synonyms) {
      if (stat.meta[sym] !== undefined) return stat.meta[sym];
      const matchedKey = Object.keys(stat.meta).find(k =>
        k.toUpperCase() === sym.toUpperCase() ||
        k.toUpperCase().replace(/[^A-Z0-9]/g, '') === sym.toUpperCase().replace(/[^A-Z0-9]/g, '')
      );
      if (matchedKey && stat.meta[matchedKey] !== undefined) return stat.meta[matchedKey];
    }

    return null;
  };

  const isTemplateOnline = (template) => {
    if (!template?.mapping) return false;
    const deviceId = template.mapping?.deviceId || template.mapping?.emChangeConfig?.device;
    const gatewayUuid = template.mapping?.gatewayUuid;
    if (deviceId && getOverallStatus(deviceId, gatewayUuid)) return true;

    const activeModules = new Set();
    ['emChangeConfig', 'emWarningConfig', 'emReadConfig', 'emVoltageConfig', 'emCurrentConfig', 'emPowerConfig', 'emSystemConfig']
      .forEach(key => {
        const cfg = template.mapping?.[key];
        if (cfg?.enabled !== false && cfg?.module) activeModules.add(String(cfg.module));
      });

    const matchingStats = telemetryStats.filter(
      stat => stat && (activeModules.has(String(stat.moduleId)) || activeModules.has(String(stat.meta?.module_id)))
    );

    if (matchingStats.length === 0) return false;

    const TELEMETRY_FRESHNESS_MS = 24 * 60 * 60 * 1000;
    return matchingStats.some(stat => {
      if (stat?.meta?.created_at_timestamp) {
        const raw = stat.meta.created_at_timestamp;
        const tsMs = raw > 1e12 ? raw : raw * 1000;
        return Math.abs(Date.now() - tsMs) < TELEMETRY_FRESHNESS_MS;
      }
      return false;
    });
  };

  const mainMeterTemplates = useMemo(
    () => (Array.isArray(templates) ? templates.filter(t => t.module === 'Main Meter' || t.category === 'MAIN_ENERGY_METER') : []),
    [templates]
  );

  const subMeterTemplates = useMemo(
    () => (Array.isArray(templates) ? templates.filter(t => t.module === 'Sub Meters' || t.category === 'SUB_ENERGY_METER' || t.category === 'ENERGY_METER') : []),
    [templates]
  );

  const extractMeterParameters = (template, isMain, index) => {
    const isOnline = isTemplateOnline(template);

    const loadKw = getTelemetryValue(template, 'emChangeConfig', 'totalKw') ?? getTelemetryValue(template, 'emPowerConfig', 'activePower');
    const loadKva = getTelemetryValue(template, 'emChangeConfig', 'totalKva') ?? getTelemetryValue(template, 'emPowerConfig', 'apparentPower');
    const reactivePower = getTelemetryValue(template, 'emChangeConfig', 'reactivePower') ?? getTelemetryValue(template, 'emPowerConfig', 'reactivePower');
    const freq = getTelemetryValue(template, 'emChangeConfig', 'freq') ?? getTelemetryValue(template, 'emSystemConfig', 'freq');
    const kwh = getTelemetryValue(template, 'emReadConfig', 'ebKwh') ?? getTelemetryValue(template, 'emChangeConfig', 'ebKwh') ?? getTelemetryValue(template, 'emConsumptionConfig', 'cumulativekWh');
    const kvah = getTelemetryValue(template, 'emReadConfig', 'ebKvah') ?? getTelemetryValue(template, 'emChangeConfig', 'ebKvah');

    const vR = getTelemetryValue(template, 'emChangeConfig', 'vR') ?? getTelemetryValue(template, 'emVoltageConfig', 'vR');
    const vY = getTelemetryValue(template, 'emChangeConfig', 'vY') ?? getTelemetryValue(template, 'emVoltageConfig', 'vY');
    const vB = getTelemetryValue(template, 'emChangeConfig', 'vB') ?? getTelemetryValue(template, 'emVoltageConfig', 'vB');

    const iR = getTelemetryValue(template, 'emChangeConfig', 'iR') ?? getTelemetryValue(template, 'emCurrentConfig', 'iR');
    const iY = getTelemetryValue(template, 'emChangeConfig', 'iY') ?? getTelemetryValue(template, 'emCurrentConfig', 'iY');
    const iB = getTelemetryValue(template, 'emChangeConfig', 'iB') ?? getTelemetryValue(template, 'emCurrentConfig', 'iB');

    const pf = getTelemetryValue(template, 'emChangeConfig', 'pf') ?? getTelemetryValue(template, 'emSystemConfig', 'pf');

    return {
      id: `${isMain ? 'MAIN' : 'SM'}-${template.id || index + 1}`,
      templateId: String(template.id || index + 1),
      name: template.mapping?.energyMeteringTarget || template.name || `${isMain ? 'Main Feed' : 'Sub Meter'} ${index + 1}`,
      category: isMain ? 'Main Feed' : resolveSubMeterCategory(template),
      type: isMain ? 'Incomer' : (template.category || 'Sub Meter'),
      isMain,
      path: isMain ? '/energy-meter/main-meter' : '/energy-meter/sub-meters',
      status: isOnline ? 'Online' : 'Offline',
      isOnline,
      loadKw: isOnline ? parseNumber(loadKw) : 0,
      loadKva: isOnline ? parseNumber(loadKva) : 0,
      reactivePower: isOnline ? parseNumber(reactivePower) : 0,
      freq: isOnline ? parseNumber(freq, 2) : 50.0,
      kwh: parseNumber(kwh),
      kvah: parseNumber(kvah),
      pf: isOnline ? parseNumber(pf, 2) : 0.95,
      vR: isOnline ? parseNumber(vR, 1) : 0,
      vY: isOnline ? parseNumber(vY, 1) : 0,
      vB: isOnline ? parseNumber(vB, 1) : 0,
      iR: isOnline ? parseNumber(iR, 1) : 0,
      iY: isOnline ? parseNumber(iY, 1) : 0,
      iB: isOnline ? parseNumber(iB, 1) : 0,
    };
  };

  const meterRows = useMemo(() => {
    const mainRows = mainMeterTemplates.map((template, index) => extractMeterParameters(template, true, index));
    const subRows = subMeterTemplates.map((template, index) => extractMeterParameters(template, false, index));
    return [...mainRows, ...subRows];
  }, [mainMeterTemplates, subMeterTemplates, telemetryStats]);

  const subMeterRows = useMemo(() => meterRows.filter(row => !row.isMain), [meterRows]);

  // Hook-based shared groups management
  const {
    meterGroups,
    setMeterGroups,
    saveGroupsToBackend,
    duplicateGroupNames,
    normalizeMeterGroups
  } = useMeterGroups(subMeterRows);

  const groupLookup = useMemo(() => {
    const map = new Map();
    meterGroups.forEach(group => {
      (group.meterIds || []).forEach(id => {
        map.set(String(id), group);
      });
    });
    return map;
  }, [meterGroups]);

  const groupedCollections = useMemo(() => {
    return meterGroups
      .map((group, index) => {
        const meters = subMeterRows.filter(row => groupLookup.get(String(row.templateId))?.id === group.id);
        const totalLoadKw = meters.reduce((sum, row) => sum + row.loadKw, 0);
        const totalLoadKva = meters.reduce((sum, row) => sum + row.loadKva, 0);
        const totalKwh = meters.reduce((sum, row) => sum + row.kwh, 0);
        const totalKvah = meters.reduce((sum, row) => sum + row.kvah, 0);
        const onlineCount = meters.filter(row => row.isOnline).length;

        return {
          id: group.id || `group-${index}`,
          name: group.name || `Group ${index + 1}`,
          color: group.color || getCategoryColor('Sub Meter'),
          meters,
          totalLoadKw,
          totalLoadKva,
          totalKwh,
          totalKvah,
          onlineCount
        };
      })
      .filter(group => group.meters.length > 0)
      .sort((a, b) => b.totalLoadKw - a.totalLoadKw);
  }, [meterGroups, subMeterRows, groupLookup]);

  const ungroupedMeters = useMemo(
    () => subMeterRows.filter(row => !groupLookup.has(String(row.templateId))),
    [subMeterRows, groupLookup]
  );

  const headlineMetrics = useMemo(() => {
    const mainRows = meterRows.filter(row => row.isMain && row.isOnline);
    const totalLoad = mainRows.length > 0
      ? mainRows.reduce((sum, row) => sum + row.loadKw, 0)
      : subMeterRows.reduce((sum, row) => sum + row.loadKw, 0);
    const totalConsumption = meterRows.reduce((sum, row) => sum + row.kwh, 0);
    const onlineMeters = meterRows.filter(row => row.isOnline).length;
    const groupedMeters = groupedCollections.reduce((sum, group) => sum + group.meters.length, 0);
    const avgPf = meterRows.length > 0 ? (meterRows.reduce((s, r) => s + (r.pf || 0.95), 0) / meterRows.length) : 0.96;

    return {
      totalLoad,
      totalConsumption,
      avgPf,
      onlineMeters,
      groupedMeters,
      totalMeters: meterRows.length,
      ungroupedMeters: ungroupedMeters.length,
    };
  }, [subMeterRows, meterRows, groupedCollections, ungroupedMeters]);

  // Group modal management
  const openGroupManager = () => {
    setGroupDrafts(normalizeMeterGroups(meterGroups));
    setShowGroupManager(true);
  };

  const handleEditGroup = (groupId) => {
    const ordered = [
      ...groupDrafts.filter(g => g.id === groupId),
      ...groupDrafts.filter(g => g.id !== groupId)
    ];
    setGroupDrafts(ordered.length ? ordered : normalizeMeterGroups(meterGroups));
    setShowGroupManager(true);
  };

  const handleDeleteGroup = async (groupId) => {
    const next = meterGroups.filter(g => g.id !== groupId);
    try {
      await saveGroupsToBackend(next);
      setGroupActionStatus('Group deleted');
      setSaveSuccessMessage('Group deleted successfully');
      setSaveSuccess(true);
    } catch (err) {
      console.error('Delete group error:', err);
    }
  };

  const addDraftGroup = () => {
    setGroupDrafts(prev => [
      ...prev,
      {
        id: createGroupId(),
        name: `Group ${prev.length + 1}`,
        color: GROUP_COLORS[prev.length % GROUP_COLORS.length],
        meterIds: [],
        isNew: true
      }
    ]);
  };

  const removeDraftGroup = (groupId) => {
    setGroupDrafts(prev => prev.filter(g => g.id !== groupId));
  };

  const updateDraftGroup = (groupId, field, value) => {
    setGroupDrafts(prev => prev.map(g => (g.id === groupId ? { ...g, [field]: value } : g)));
  };

  const toggleDraftMeter = (groupId, templateId) => {
    const targetId = String(templateId);
    setGroupDrafts(prev => {
      const assignedElsewhere = prev.find(g => g.id !== groupId && g.meterIds.includes(targetId));
      if (assignedElsewhere) return prev;
      return prev.map(g => {
        if (g.id === groupId) {
          const checked = g.meterIds.includes(targetId);
          return {
            ...g,
            meterIds: checked ? g.meterIds.filter(id => id !== targetId) : [...g.meterIds, targetId]
          };
        }
        return g;
      });
    });
  };

  const handleSaveDraftGroups = async () => {
    try {
      await saveGroupsToBackend(groupDrafts);
      setShowGroupManager(false);
      setSaveSuccessMessage('Meter groups saved successfully');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2400);
    } catch (err) {
      console.error('Save groups error:', err);
    }
  };

  return (
    <div className="energy-overview-page p-3 p-md-4" style={{ background: '#0a101d', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* Dynamic Top Header & View Switcher Toolbar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 p-3 rounded-4" style={{ background: 'linear-gradient(135deg, rgba(19, 27, 44, 0.8), rgba(15, 23, 42, 0.9))', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="p-2.5 rounded-3 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.1))', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold text-white mb-0" style={{ letterSpacing: '-0.3px' }}>Energy Metering Dashboard</h4>
              <span className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-2.5 py-1" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', fontSize: '0.68rem', fontWeight: 600 }}>
                <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '6px', height: '6px' }} /> REALTIME
              </span>
            </div>
            <p className="text-secondary mb-0 fs-13 mt-0.5">Live SCADA telemetry, facility active load hierarchy, and feeder distribution.</p>
          </div>
        </div>

        {/* View Switcher Toggle Pill */}
        <div className="d-flex align-items-center gap-1.5 p-1.5 rounded-pill" style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
          <button
            type="button"
            onClick={() => setViewMode('solar')}
            className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-2 transition-all ${
              viewMode === 'solar'
                ? 'text-dark shadow-sm'
                : 'text-secondary border-0 bg-transparent'
            }`}
            style={{
              background: viewMode === 'solar' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'transparent',
              boxShadow: viewMode === 'solar' ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none',
              fontWeight: 600
            }}
          >
            <Sun size={16} className={viewMode === 'solar' ? 'text-dark' : 'text-warning'} /> Solar Generation
          </button>
          <button
            type="button"
            onClick={() => setViewMode('overview')}
            className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-2 transition-all ${
              viewMode === 'overview'
                ? 'text-white shadow-sm'
                : 'text-secondary border-0 bg-transparent'
            }`}
            style={{
              background: viewMode === 'overview' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
              boxShadow: viewMode === 'overview' ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
              fontWeight: 600
            }}
          >
            <LayoutDashboard size={16} /> Facility Overview
          </button>
        </div>
      </div>

      {viewMode === 'solar' ? (
        <div className="solar-view-container fade-in" style={{ minHeight: 'calc(100vh - 180px)' }}>
          <SolarDashboard
            mainMeters={meterRows.filter(row => row.isMain)}
            subMeters={subMeterRows}
          />
        </div>
      ) : (
        <div className="facility-overview-container fade-in">
          {/* 1. Ultra-Sleek Glassmorphic KPI Cards */}
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <Card
                className="border-0 h-100 transition-all hover-lift"
                style={{
                  background: 'linear-gradient(135deg, rgba(19, 27, 44, 0.85), rgba(15, 23, 42, 0.95))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '18px',
                  boxShadow: '0 8px 24px -6px rgba(56, 189, 248, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)' }} />
                <Card.Body className="p-3.5">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>Total Active Demand</span>
                    <div className="p-2.5 rounded-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8' }}>
                      <Zap size={20} />
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bolder text-white font-monospace" style={{ fontSize: '2.1rem', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMetric(headlineMetrics.totalLoad)}
                    </span>
                    <span className="fw-bold fs-6" style={{ color: '#38bdf8' }}>kW</span>
                  </div>
                  <div className="d-flex align-items-center gap-1.5 mt-3 pt-2.5 border-top border-secondary border-opacity-10 text-secondary" style={{ fontSize: '0.73rem' }}>
                    <TrendingUp size={13} className="text-success" />
                    <span>Real-time instantaneous facility demand</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} xl={3}>
              <Card
                className="border-0 h-100 transition-all hover-lift"
                style={{
                  background: 'linear-gradient(135deg, rgba(19, 27, 44, 0.85), rgba(15, 23, 42, 0.95))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '18px',
                  boxShadow: '0 8px 24px -6px rgba(16, 185, 129, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                <Card.Body className="p-3.5">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>Total Energy (EB)</span>
                    <div className="p-2.5 rounded-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981' }}>
                      <Activity size={20} />
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bolder text-white font-monospace" style={{ fontSize: '2.1rem', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMetric(headlineMetrics.totalConsumption)}
                    </span>
                    <span className="fw-bold fs-6" style={{ color: '#10b981' }}>kWh</span>
                  </div>
                  <div className="d-flex align-items-center gap-1.5 mt-3 pt-2.5 border-top border-secondary border-opacity-10 text-secondary" style={{ fontSize: '0.73rem' }}>
                    <ShieldCheck size={13} className="text-success" />
                    <span>Cumulative consumption across active meters</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} xl={3}>
              <Card
                className="border-0 h-100 transition-all hover-lift"
                style={{
                  background: 'linear-gradient(135deg, rgba(19, 27, 44, 0.85), rgba(15, 23, 42, 0.95))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '18px',
                  boxShadow: '0 8px 24px -6px rgba(245, 158, 11, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
                <Card.Body className="p-3.5">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>Grid Power Quality</span>
                    <div className="p-2.5 rounded-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#f59e0b' }}>
                      <Gauge size={20} />
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bolder text-white font-monospace" style={{ fontSize: '2.1rem', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMetric(headlineMetrics.avgPf, 2)}
                    </span>
                    <span className="fw-bold fs-6" style={{ color: '#f59e0b' }}>Avg PF</span>
                  </div>
                  <div className="d-flex align-items-center gap-1.5 mt-3 pt-2.5 border-top border-secondary border-opacity-10 text-secondary" style={{ fontSize: '0.73rem' }}>
                    <span>Grid Frequency: <strong className="text-white">50.0 Hz</strong></span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} xl={3}>
              <Card
                className="border-0 h-100 transition-all hover-lift"
                style={{
                  background: 'linear-gradient(135deg, rgba(19, 27, 44, 0.85), rgba(15, 23, 42, 0.95))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '18px',
                  boxShadow: '0 8px 24px -6px rgba(168, 85, 247, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #c084fc, #9333ea)' }} />
                <Card.Body className="p-3.5">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="text-secondary text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.8px' }}>Active Meter Feeds</span>
                    <div className="p-2.5 rounded-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#c084fc' }}>
                      <Network size={20} />
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bolder text-white font-monospace" style={{ fontSize: '2.1rem', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                      {headlineMetrics.onlineMeters} <span className="fs-5 text-secondary font-sans fw-normal">/ {headlineMetrics.totalMeters}</span>
                    </span>
                    <span className="fw-bold fs-6 text-success">Online</span>
                  </div>
                  <div className="d-flex align-items-center gap-1.5 mt-3 pt-2.5 border-top border-secondary border-opacity-10 text-secondary" style={{ fontSize: '0.73rem' }}>
                    <Radio size={13} className={headlineMetrics.onlineMeters > 0 ? 'text-success' : 'text-danger'} />
                    <span>{headlineMetrics.groupedMeters} grouped, {headlineMetrics.ungroupedMeters} standalone</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* 2. Group Distribution Section */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 mt-4">
            <div className="d-flex align-items-center gap-2.5">
              <div className="p-2 rounded-3 text-warning d-flex align-items-center justify-content-center" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <Layers3 size={18} />
              </div>
              <h5 className="fw-bold text-white mb-0" style={{ letterSpacing: '-0.2px' }}>Feeder Groups & Load Hierarchy</h5>
              <Badge bg="dark" className="border border-secondary border-opacity-25 text-warning fw-semibold px-2.5 py-1">
                {groupedCollections.length} Ranked Groups
              </Badge>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => setShowGroups(!showGroups)}
                className="btn btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 text-light border-secondary border-opacity-50 transition-all"
                style={{ background: 'rgba(30, 41, 59, 0.6)' }}
              >
                {showGroups ? <EyeOff size={14} /> : <Eye size={14} />}
                {showGroups ? 'Collapse Groups' : 'Expand Groups'}
              </button>
              <button
                type="button"
                onClick={openGroupManager}
                className="btn btn-sm btn-outline-warning rounded-pill px-3.5 py-1.5 d-flex align-items-center gap-1.5 fw-semibold transition-all shadow-sm"
              >
                <Settings2 size={14} /> Manage Groups
              </button>
            </div>
          </div>

          {showGroups && (
            groupedCollections.length === 0 ? (
              <div
                className="p-5 rounded-4 text-center mb-4 transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(19, 27, 44, 0.6), rgba(15, 23, 42, 0.8))',
                  backdropFilter: 'blur(12px)',
                  border: '1px dashed rgba(245, 158, 11, 0.3)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
                }}
              >
                <div
                  className="d-inline-flex p-3 rounded-circle mb-3 text-warning"
                  style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.05))', border: '1px solid rgba(245, 158, 11, 0.3)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}
                >
                  <FolderTree size={36} />
                </div>
                <h5 className="text-white fw-bold mb-1">No Custom Groups Configured</h5>
                <p className="text-secondary fs-13 mb-4 mx-auto" style={{ maxWidth: '480px' }}>
                  Organize and cluster your sub-meters into logical floor levels, building wings, or utility departments for aggregate load & energy analytics.
                </p>
                <button
                  type="button"
                  onClick={openGroupManager}
                  className="btn btn-warning rounded-pill px-4 py-2 fw-bold text-dark shadow-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)' }}
                >
                  <Plus size={16} className="me-1" /> Create First Group
                </button>
              </div>
            ) : (
              <Row className="g-3 mb-4">
                {groupedCollections.map((group, idx) => (
                  <Col key={group.id} sm={6} lg={4} xl={3}>
                    <Card
                      className="border-0 h-100 shadow-sm transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(19, 27, 44, 0.85), rgba(15, 23, 42, 0.95))',
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${group.color}44`,
                        borderTop: `4px solid ${group.color}`,
                        borderRadius: '16px'
                      }}
                    >
                      <Card.Body className="p-3.5 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: group.color, boxShadow: `0 0 8px ${group.color}` }} />
                              <h6 className="text-white fw-bold mb-0 text-truncate" style={{ maxWidth: '140px' }}>{group.name}</h6>
                            </div>
                            <Badge bg="dark" className="border border-secondary border-opacity-25 text-warning font-monospace" style={{ fontSize: '0.65rem' }}>
                              #{idx + 1} Load
                            </Badge>
                          </div>
                          <div className="d-flex align-items-baseline gap-1.5 my-2">
                            <span className="fs-3 fw-bold text-white font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {formatMetric(group.totalLoadKw)}
                            </span>
                            <span className="text-secondary fs-13 fw-semibold">kW</span>
                          </div>
                          <div className="d-flex justify-content-between text-secondary fs-12 mb-3">
                            <span>{group.meters.length} meter(s)</span>
                            <span className="text-success fw-semibold">{group.onlineCount} online</span>
                          </div>
                        </div>

                        <div className="d-flex gap-2 pt-2.5 border-top border-secondary border-opacity-20">
                          <button
                            type="button"
                            onClick={() => handleEditGroup(group.id)}
                            className="btn btn-sm btn-outline-secondary rounded-pill py-1 px-3 flex-grow-1 text-light border-secondary border-opacity-50 fs-12"
                          >
                            <Settings2 size={12} className="me-1" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="btn btn-sm btn-outline-danger rounded-pill py-1 px-2.5 fs-12"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )
          )}

          {/* 3. Feeder Meters Telemetry Table */}
          <Card
            className="border-0 shadow-sm mt-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(19, 27, 44, 0.8), rgba(15, 23, 42, 0.95))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px'
            }}
          >
            <Card.Header
              className="bg-transparent border-bottom border-secondary border-opacity-20 p-3.5 d-flex justify-content-between align-items-center flex-wrap gap-2"
              style={{ background: 'rgba(15, 23, 42, 0.6)' }}
            >
              <div className="d-flex align-items-center gap-2.5">
                <div className="p-2 rounded-3 text-primary d-flex align-items-center justify-content-center" style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <Activity size={18} />
                </div>
                <div>
                  <h6 className="fw-bold text-white mb-0">Live Feeder & Meter Telemetry</h6>
                  <small className="text-secondary fs-12">Click any meter row to inspect its live electrical waveform and digital twin.</small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/energy-meter/sub-meters')}
                className="btn btn-sm btn-outline-primary rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm transition-all"
              >
                View Full Submeters Grid <ArrowRight size={14} />
              </button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover borderless className="align-middle text-white mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead style={{ background: 'rgba(10, 16, 29, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <tr className="text-secondary text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.8px', fontWeight: 700 }}>
                      <th className="py-3.5 px-4">Meter / Feeder</th>
                      <th className="py-3.5">Type</th>
                      <th className="py-3.5 text-end">Load (kW)</th>
                      <th className="py-3.5 text-end">Energy (kWh)</th>
                      <th className="py-3.5 text-center">Voltages (<span style={{ color: '#f87171' }}>R</span> / <span style={{ color: '#fbbf24' }}>Y</span> / <span style={{ color: '#38bdf8' }}>B</span>)</th>
                      <th className="py-3.5 text-center">Currents (<span style={{ color: '#f87171' }}>R</span> / <span style={{ color: '#fbbf24' }}>Y</span> / <span style={{ color: '#38bdf8' }}>B</span>)</th>
                      <th className="py-3.5 text-center">PF</th>
                      <th className="py-3.5 text-center px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meterRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-secondary">
                          <Activity size={32} className="opacity-40 mb-2" />
                          <div>No Energy Meters configured for this site yet.</div>
                        </td>
                      </tr>
                    ) : (
                      meterRows.map(meter => (
                        <tr
                          key={meter.id}
                          onClick={() => navigate(meter.path)}
                          style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s ease' }}
                          className="hover-row"
                        >
                          <td className="py-3 px-4">
                            <div className="fw-bold text-white fs-14">{meter.name}</div>
                            <small className="text-secondary font-monospace" style={{ fontSize: '0.7rem' }}>{meter.id}</small>
                          </td>
                          <td className="py-3">
                            <Badge
                              bg={meter.isMain ? 'primary' : 'dark'}
                              className={`border border-secondary border-opacity-25 px-2.5 py-1 ${meter.isMain ? 'text-white bg-primary' : 'text-secondary'}`}
                              style={{ fontSize: '0.68rem', fontWeight: 600 }}
                            >
                              {meter.category}
                            </Badge>
                          </td>
                          <td className="py-3 text-end fw-bold text-warning font-monospace" style={{ fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>
                            {formatMetric(meter.loadKw)}
                          </td>
                          <td className="py-3 text-end text-success fw-semibold font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatMetric(meter.kwh)}
                          </td>
                          <td className="py-3 text-center font-monospace" style={{ fontSize: '0.78rem' }}>
                            <span style={{ color: '#f87171' }}>{formatMetric(meter.vR)}</span> <span className="text-secondary">/</span>{' '}
                            <span style={{ color: '#fbbf24' }}>{formatMetric(meter.vY)}</span> <span className="text-secondary">/</span>{' '}
                            <span style={{ color: '#38bdf8' }}>{formatMetric(meter.vB)}</span> <span className="text-muted fs-11">V</span>
                          </td>
                          <td className="py-3 text-center font-monospace" style={{ fontSize: '0.78rem' }}>
                            <span style={{ color: '#f87171' }}>{formatMetric(meter.iR)}</span> <span className="text-secondary">/</span>{' '}
                            <span style={{ color: '#fbbf24' }}>{formatMetric(meter.iY)}</span> <span className="text-secondary">/</span>{' '}
                            <span style={{ color: '#38bdf8' }}>{formatMetric(meter.iB)}</span> <span className="text-muted fs-11">A</span>
                          </td>
                          <td className="py-3 text-center font-monospace text-info fw-semibold">
                            {formatMetric(meter.pf, 2)}
                          </td>
                          <td className="py-3 text-center px-4">
                            <Badge
                              bg="transparent"
                              className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 text-uppercase"
                              style={{
                                color: meter.isOnline ? '#4ade80' : '#94a3b8',
                                background: meter.isOnline ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                                border: `1px solid ${meter.isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
                                fontSize: '0.65rem',
                                fontWeight: 700
                              }}
                            >
                              <span
                                className="rounded-circle"
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  backgroundColor: meter.isOnline ? '#22c55e' : '#64748b',
                                  boxShadow: meter.isOnline ? '0 0 6px #22c55e' : 'none'
                                }}
                              />
                              {meter.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Group Manager Modal */}
      <Modal
        show={showGroupManager}
        onHide={() => setShowGroupManager(false)}
        size="xl"
        centered
        contentClassName="border-0 text-white"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-25 py-3" style={{ background: '#0f172a' }}>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 fs-5">
            <Settings2 className="text-warning" size={20} /> Configure Meter Groups
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: '#090e1a' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h6 className="text-white fw-bold mb-1">Group Assignment & Color Tagging</h6>
              <small className="text-secondary">Organize feeder meters into logical building wings, HVAC plants, or tenant distribution.</small>
            </div>
            <button
              type="button"
              onClick={addDraftGroup}
              className="btn btn-sm btn-outline-warning rounded-pill px-3 d-flex align-items-center gap-1"
            >
              <Plus size={14} /> Add Group
            </button>
          </div>

          <Row className="g-3">
            {groupDrafts.map((group, index) => (
              <Col key={group.id} md={6}>
                <div className="p-3 rounded-3 border border-secondary border-opacity-25" style={{ background: 'rgba(15, 23, 42, 0.75)' }}>
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                      <Form.Control
                        type="color"
                        value={group.color}
                        onChange={(e) => updateDraftGroup(group.id, 'color', e.target.value)}
                        style={{ width: '38px', height: '34px', padding: '2px', cursor: 'pointer' }}
                        className="bg-dark border-0 rounded"
                      />
                      <Form.Control
                        type="text"
                        value={group.name}
                        onChange={(e) => updateDraftGroup(group.id, 'name', e.target.value)}
                        className="bg-dark text-white border-secondary border-opacity-50 py-1"
                        placeholder={`Group ${index + 1}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDraftGroup(group.id)}
                      className="btn btn-sm btn-outline-danger rounded-circle p-1"
                      title="Remove Group"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="d-flex flex-wrap gap-1 max-height-150 overflow-auto">
                    {subMeterRows.map(m => {
                      const mId = String(m.templateId);
                      const isChecked = group.meterIds.includes(mId);
                      const assignedOther = groupDrafts.find(g => g.id !== group.id && g.meterIds.includes(mId));
                      return (
                        <Badge
                          key={mId}
                          onClick={() => !assignedOther && toggleDraftMeter(group.id, mId)}
                          bg={isChecked ? 'primary' : 'dark'}
                          className={`p-2 border ${isChecked ? 'border-primary' : 'border-secondary border-opacity-25'} text-truncate`}
                          style={{
                            cursor: assignedOther ? 'not-allowed' : 'pointer',
                            opacity: assignedOther ? 0.4 : 1,
                            maxWidth: '180px'
                          }}
                          title={assignedOther ? `Assigned to ${assignedOther.name}` : m.name}
                        >
                          {isChecked && <CheckCircle2 size={12} className="me-1 inline" />}
                          {m.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top border-secondary border-opacity-25 py-3" style={{ background: '#0f172a' }}>
          <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setShowGroupManager(false)}>
            Cancel
          </Button>
          <Button variant="warning" className="rounded-pill px-4 fw-bold text-dark" onClick={handleSaveDraftGroups}>
            Save Groups
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Notification Modal */}
      <Modal
        show={saveSuccess}
        onHide={() => setSaveSuccess(false)}
        centered
        size="sm"
        contentClassName="border-0 text-white"
      >
        <Modal.Body className="p-4 text-center rounded-4" style={{ background: '#0f172a', border: '1px solid #10b981' }}>
          <CheckCircle2 size={42} className="text-success mb-2" />
          <h6 className="fw-bold text-white mb-1">{saveSuccessMessage}</h6>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EnergyMeteringOverview;
