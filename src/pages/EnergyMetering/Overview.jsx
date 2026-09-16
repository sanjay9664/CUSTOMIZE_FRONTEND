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
  Radio
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
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'solar'

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
    <div className="energy-overview-page p-3 p-md-4">
      {/* Header bar with View Switcher */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold text-white mb-0">Energy Metering Overview</h4>
            <Badge bg="primary" className="bg-opacity-20 text-primary border border-primary border-opacity-30">
              Live BMS SCADA
            </Badge>
          </div>
          <small className="text-secondary">
            Aggregate power consumption, demand loads, feeder health, and group distribution.
          </small>
        </div>

        {/* View Switcher Pill */}
        <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-75 p-1 rounded-pill border border-secondary border-opacity-25">
          <button
            type="button"
            onClick={() => setViewMode('overview')}
            className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-2 transition-all ${
              viewMode === 'overview' ? 'btn-primary text-white shadow-sm' : 'text-secondary border-0 bg-transparent'
            }`}
          >
            <LayoutDashboard size={15} /> Facility Overview
          </button>
          <button
            type="button"
            onClick={() => setViewMode('solar')}
            className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-2 transition-all ${
              viewMode === 'solar' ? 'btn-warning text-dark shadow-sm' : 'text-secondary border-0 bg-transparent'
            }`}
          >
            <Sun size={15} /> Solar Generation
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
          {/* 1. KPI Headline Cards */}
          <Row className="g-3 mb-4">
            <Col sm={6} xl={3}>
              <Card className="scada-stat-card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', borderLeft: '4px solid #38bdf8' }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>Total Active Demand</span>
                    <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info">
                      <Zap size={18} />
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bold text-white fs-3 font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMetric(headlineMetrics.totalLoad)}
                    </span>
                    <span className="text-info fw-bold fs-6">kW</span>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-2 text-secondary" style={{ fontSize: '0.72rem' }}>
                    <TrendingUp size={12} className="text-success" />
                    <span>Real-time instantaneous facility demand</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} xl={3}>
              <Card className="scada-stat-card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', borderLeft: '4px solid #10b981' }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>Total Energy (EB)</span>
                    <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                      <Activity size={18} />
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bold text-white fs-3 font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMetric(headlineMetrics.totalConsumption)}
                    </span>
                    <span className="text-success fw-bold fs-6">kWh</span>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-2 text-secondary" style={{ fontSize: '0.72rem' }}>
                    <ShieldCheck size={12} className="text-success" />
                    <span>Cumulative consumption across active meters</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} xl={3}>
              <Card className="scada-stat-card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', borderLeft: '4px solid #f59e0b' }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>Grid Power Quality</span>
                    <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
                      <Gauge size={18} />
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bold text-white fs-3 font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMetric(headlineMetrics.avgPf, 2)}
                    </span>
                    <span className="text-warning fw-bold fs-6">Avg PF</span>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-2 text-secondary" style={{ fontSize: '0.72rem' }}>
                    <span>Frequency: <strong className="text-white">50.0 Hz</strong></span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col sm={6} xl={3}>
              <Card className="scada-stat-card border-0 h-100 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', borderLeft: '4px solid #a855f7' }}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>Active Meter Feeds</span>
                    <div className="p-2 rounded-3 bg-purple bg-opacity-10 text-purple" style={{ color: '#c084fc' }}>
                      <Network size={18} />
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bold text-white fs-3 font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {headlineMetrics.onlineMeters} / {headlineMetrics.totalMeters}
                    </span>
                    <span className="text-muted fs-6">Online</span>
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-2 text-secondary" style={{ fontSize: '0.72rem' }}>
                    <Radio size={12} className={headlineMetrics.onlineMeters > 0 ? 'text-success' : 'text-danger'} />
                    <span>{headlineMetrics.groupedMeters} grouped, {headlineMetrics.ungroupedMeters} standalone</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* 2. Group Distribution Section */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 mt-4">
            <div className="d-flex align-items-center gap-2">
              <Layers3 size={20} className="text-warning" />
              <h5 className="fw-bold text-white mb-0">Feeder Groups & Load Hierarchy</h5>
              <Badge bg="secondary" className="bg-opacity-25 text-secondary fw-normal">
                {groupedCollections.length} Ranked Groups
              </Badge>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => setShowGroups(!showGroups)}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-flex align-items-center gap-1 text-light border-secondary border-opacity-50"
              >
                {showGroups ? <EyeOff size={14} /> : <Eye size={14} />}
                {showGroups ? 'Collapse Groups' : 'Expand Groups'}
              </button>
              <button
                type="button"
                onClick={openGroupManager}
                className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 d-flex align-items-center gap-1 fw-semibold"
              >
                <Settings2 size={14} /> Manage Groups
              </button>
            </div>
          </div>

          {showGroups && (
            groupedCollections.length === 0 ? (
              <div className="p-4 rounded-4 border border-secondary border-opacity-25 bg-dark bg-opacity-50 text-center mb-4">
                <FolderTree size={36} className="text-secondary mb-2 opacity-50" />
                <h6 className="text-white fw-bold mb-1">No Custom Groups Configured</h6>
                <p className="text-secondary fs-13 mb-3">Group your sub-meters by floor, wing, or utility department for aggregate demand analytics.</p>
                <button
                  type="button"
                  onClick={openGroupManager}
                  className="btn btn-sm btn-warning rounded-pill px-3 fw-bold"
                >
                  <Plus size={14} className="me-1" /> Create First Group
                </button>
              </div>
            ) : (
              <Row className="g-3 mb-4">
                {groupedCollections.map((group, idx) => (
                  <Col key={group.id} sm={6} lg={4} xl={3}>
                    <Card
                      className="border-0 h-100 shadow-sm transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))',
                        borderTop: `3px solid ${group.color}`,
                        borderRadius: '14px'
                      }}
                    >
                      <Card.Body className="p-3 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: group.color }} />
                              <h6 className="text-white fw-bold mb-0 text-truncate" style={{ maxWidth: '140px' }}>{group.name}</h6>
                            </div>
                            <Badge bg="dark" className="border border-secondary border-opacity-25 text-warning font-monospace" style={{ fontSize: '0.65rem' }}>
                              #{idx + 1} Load
                            </Badge>
                          </div>
                          <div className="d-flex align-items-baseline gap-1 my-2">
                            <span className="fs-4 fw-bold text-white font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {formatMetric(group.totalLoadKw)}
                            </span>
                            <span className="text-secondary fs-13">kW</span>
                          </div>
                          <div className="d-flex justify-content-between text-secondary fs-12 mb-3">
                            <span>{group.meters.length} meter(s)</span>
                            <span className="text-success">{group.onlineCount} online</span>
                          </div>
                        </div>

                        <div className="d-flex gap-2 pt-2 border-top border-secondary border-opacity-25">
                          <button
                            type="button"
                            onClick={() => handleEditGroup(group.id)}
                            className="btn btn-sm btn-outline-secondary rounded-pill py-0 px-2 flex-grow-1 text-light border-secondary border-opacity-50 fs-12"
                          >
                            <Settings2 size={11} className="me-1" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group.id)}
                            className="btn btn-sm btn-outline-danger rounded-pill py-0 px-2 fs-12"
                          >
                            <Trash2 size={11} />
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
          <Card className="border-0 shadow-sm mt-4" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))', borderRadius: '16px' }}>
            <Card.Header className="bg-transparent border-bottom border-secondary border-opacity-25 p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h6 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                  <Activity size={18} className="text-primary" /> Live Feeder & Meter Telemetry
                </h6>
                <small className="text-secondary">Click any meter row to inspect its live waveform and digital twin.</small>
              </div>
              <button
                type="button"
                onClick={() => navigate('/energy-meter/sub-meters')}
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1"
              >
                View Full Submeters Grid <ArrowRight size={14} />
              </button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover borderless className="align-middle text-white mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <tr className="text-secondary text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                      <th className="py-3 px-3">Meter / Feeder</th>
                      <th className="py-3">Type</th>
                      <th className="py-3 text-end">Load (kW)</th>
                      <th className="py-3 text-end">Energy (kWh)</th>
                      <th className="py-3 text-center">Voltages (R / Y / B)</th>
                      <th className="py-3 text-center">Currents (R / Y / B)</th>
                      <th className="py-3 text-center">PF</th>
                      <th className="py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meterRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-secondary">
                          No Energy Meters configured for this site yet.
                        </td>
                      </tr>
                    ) : (
                      meterRows.map(meter => (
                        <tr
                          key={meter.id}
                          onClick={() => navigate(meter.path)}
                          style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          className="hover-row"
                        >
                          <td className="py-3 px-3">
                            <div className="fw-bold text-white">{meter.name}</div>
                            <small className="text-secondary font-monospace" style={{ fontSize: '0.7rem' }}>{meter.id}</small>
                          </td>
                          <td className="py-3">
                            <Badge
                              bg={meter.isMain ? 'primary' : 'dark'}
                              className={`border border-secondary border-opacity-25 ${meter.isMain ? 'text-white' : 'text-secondary'}`}
                            >
                              {meter.category}
                            </Badge>
                          </td>
                          <td className="py-3 text-end fw-bold text-warning font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatMetric(meter.loadKw)}
                          </td>
                          <td className="py-3 text-end text-success font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatMetric(meter.kwh)}
                          </td>
                          <td className="py-3 text-center font-monospace text-secondary" style={{ fontSize: '0.75rem' }}>
                            {formatMetric(meter.vR)} | {formatMetric(meter.vY)} | {formatMetric(meter.vB)} V
                          </td>
                          <td className="py-3 text-center font-monospace text-secondary" style={{ fontSize: '0.75rem' }}>
                            {formatMetric(meter.iR)} | {formatMetric(meter.iY)} | {formatMetric(meter.iB)} A
                          </td>
                          <td className="py-3 text-center font-monospace text-info">
                            {formatMetric(meter.pf, 2)}
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              bg={meter.isOnline ? 'success' : 'secondary'}
                              className="bg-opacity-20 text-uppercase"
                              style={{
                                color: meter.isOnline ? '#4ade80' : '#94a3b8',
                                border: `1px solid ${meter.isOnline ? '#22c55e44' : '#64748b44'}`,
                                fontSize: '0.65rem'
                              }}
                            >
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
