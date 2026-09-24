import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Offcanvas, Form, Button, Row, Col, Badge, Spinner, Modal, InputGroup } from 'react-bootstrap';
import { FileText, BarChart2, Sliders, LayoutGrid, Trash2, X, Plus, Cpu, ArrowUpRight, ArrowDownRight, Zap, Activity, Check, RotateCcw } from 'lucide-react';
import { useSiteStore } from '../../../../context/SiteContext';
import { fetchAndStoreSochiotAccessToken } from '../../../../services/bmsService';
import LocationDeviceFilter from '../../../../components/common/LocationDeviceFilter';
import LocationCascaderSelector from '../../../../components/common/LocationCascaderSelector';
import { parseLocationValue } from '../../../../utils/locationTreeUtils';
import { fetchDeviceDetails, extractDeviceModulesAndFields, fetchDevicesByDeviceIds } from '../../../../services/sochiotLocationService';
import { getApiUrl } from '../../../../utils/apiConfig';
import { DEVICE_CATEGORIES, formatCategoryLabel, getTemplateForCategory } from '../../../../constants/deviceTemplates';
import { isCumulativeMetric } from '../../../../types/device.types';

export const findMatchingModule = (modules, row) => {
  if (!Array.isArray(modules) || modules.length === 0 || !row) return null;
  const rowModId = row.moduleId ? String(row.moduleId).trim() : '';
  const rowModName = (row.moduleName || '').trim().toLowerCase();
  const rowField = (row.sochiotFieldName || '').trim().toLowerCase();

  // 1. Direct ID match
  if (rowModId) {
    const byId = modules.find(m => String(m.id) === rowModId);
    if (byId) return byId;
  }

  // 2. If rowModId matches module name or clean label (e.g. rowModId is "CHANGE")
  if (rowModId) {
    const byNameInId = modules.find(m => {
      const mName = (m.name || '').trim().toLowerCase();
      const mClean = (m.label || m.name || '').replace(/\s*\((general|other)\)/gi, '').trim().toLowerCase();
      return mName === rowModId.toLowerCase() || mClean === rowModId.toLowerCase();
    });
    if (byNameInId) return byNameInId;
  }

  // 3. Match by row.moduleName
  if (rowModName) {
    const byModName = modules.find(m => {
      const mName = (m.name || '').trim().toLowerCase();
      const mClean = (m.label || m.name || '').replace(/\s*\((general|other)\)/gi, '').trim().toLowerCase();
      return mName === rowModName || mClean === rowModName;
    });
    if (byModName) return byModName;
  }

  // 4. Match by event field presence
  if (rowField) {
    const byField = modules.find(m =>
      m.allFields?.some(af => (af.fieldName || '').trim().toLowerCase() === rowField)
    );
    if (byField) return byField;
  }

  return null;
};

const RegisterDeviceModal = ({
  show,
  onHide,
  registerStep = 1,
  setRegisterStep = () => {},
  registerForm = {},
  setRegisterForm = () => {},
  sites = [],
  activeAssets = [],
  editingDevice = null,
  activeAreas = [],
  activeBuildings = [],
  companies = [],
  tenants = [],
  zones = [],
  dynamicTemplateFields = [],
  setDynamicTemplateFields = () => {},
  fetchDevices = () => {},
  showToast = () => {},
  loading = false,
  setLoading = () => {},
  setDevices = () => {},
  setSelectedBuildingFilter = () => {},
  setSelectedAreaFilter = () => {},
  setSearchTerm = () => {},
  API_BASE_URL = '',
  getAuthHeaders = () => ({}),
  selectedSiteFilter = ''
}) => {
  const { activeSites: storeActiveSites } = useSiteStore();
  const effectiveSites = (sites && sites.length > 0) ? sites : (storeActiveSites || []);

  const [selectedHardwareDevice, setSelectedHardwareDevice] = useState(null);
  const [availableHardwareDevices, setAvailableHardwareDevices] = useState([]);
  const [hardwareDeviceTree, setHardwareDeviceTree] = useState([]);

  // Threshold Limits configuration modal state
  const [thresholdModalIndex, setThresholdModalIndex] = useState(null);
  const [thresholdDraft, setThresholdDraft] = useState({
    warningHigh: '',
    criticalHigh: '',
    warningLow: '',
    criticalLow: '',
    isCumulative: false,
    isTelemetry: true
  });

  const handleOpenThresholdModal = (idx) => {
    const f = dynamicTemplateFields[idx] || {};
    setThresholdModalIndex(idx);
    setThresholdDraft({
      warningHigh: f.warningHigh !== undefined && f.warningHigh !== null ? f.warningHigh : '',
      criticalHigh: f.criticalHigh !== undefined && f.criticalHigh !== null ? f.criticalHigh : '',
      warningLow: f.warningLow !== undefined && f.warningLow !== null ? f.warningLow : '',
      criticalLow: f.criticalLow !== undefined && f.criticalLow !== null ? f.criticalLow : '',
      isCumulative: isCumulativeMetric(f),
      isTelemetry: f.isTelemetry !== false
    });
  };

  const handleCloseThresholdModal = () => {
    setThresholdModalIndex(null);
  };

  const handleClearThresholdDraft = () => {
    setThresholdDraft(prev => ({
      ...prev,
      warningHigh: '',
      criticalHigh: '',
      warningLow: '',
      criticalLow: ''
    }));
  };

  const handleSaveThresholdDraft = () => {
    if (thresholdModalIndex === null) return;
    const copy = [...dynamicTemplateFields];
    if (copy[thresholdModalIndex]) {
      const parseVal = (val) => {
        if (val === '' || val === null || val === undefined) return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      const wH = parseVal(thresholdDraft.warningHigh);
      const cH = parseVal(thresholdDraft.criticalHigh);
      const wL = parseVal(thresholdDraft.warningLow);
      const cL = parseVal(thresholdDraft.criticalLow);

      copy[thresholdModalIndex].warningHigh = wH;
      copy[thresholdModalIndex].criticalHigh = cH;
      copy[thresholdModalIndex].warningLow = wL;
      copy[thresholdModalIndex].criticalLow = cL;
      copy[thresholdModalIndex].thresholdValue = wH !== null ? wH : '';
      copy[thresholdModalIndex].isCumulative = Boolean(thresholdDraft.isCumulative);
      copy[thresholdModalIndex].isTelemetry = Boolean(thresholdDraft.isTelemetry);
      setDynamicTemplateFields(copy);
    }
    setThresholdModalIndex(null);
  };

  // Device configuration cache: { [deviceId]: { device, modules } }
  const [deviceConfigs, setDeviceConfigs] = useState({});
  const [loadingDeviceIds, setLoadingDeviceIds] = useState({});
  const inFlightDeviceIds = useRef(new Set());
  const attemptedDeviceIds = useRef(new Set());

  // Reset attempted/in-flight cache when modal opens for a new/different device
  const prevDeviceIdRef = useRef(null);
  useEffect(() => {
    if (show) {
      const currentDevId = editingDevice?.id || 'new';
      if (prevDeviceIdRef.current !== currentDevId) {
        prevDeviceIdRef.current = currentDevId;
        attemptedDeviceIds.current.clear();
        inFlightDeviceIds.current.clear();
      }
    }
  }, [show, editingDevice?.id]);

  const handleDeviceTreeLoaded = React.useCallback((tree) => {
    setHardwareDeviceTree(tree || []);
  }, []);

  const loadDeviceConfig = useCallback(async (deviceId, rowIdx = null) => {
    if (!deviceId || deviceId === '101') return;
    const cleanId = String(deviceId).trim();
    if (!cleanId) return;

    // Prevent duplicate in-flight or re-attempting failed device IDs
    if (attemptedDeviceIds.current.has(cleanId) || inFlightDeviceIds.current.has(cleanId)) return;

    inFlightDeviceIds.current.add(cleanId);
    attemptedDeviceIds.current.add(cleanId);

    setLoadingDeviceIds(prev => ({ ...prev, [cleanId]: true }));
    try {
      const raw = await fetchDeviceDetails(cleanId);
      if (raw) {
        const parsed = extractDeviceModulesAndFields(raw);
        setDeviceConfigs(prev => ({ ...prev, [cleanId]: parsed || { modules: [] } }));

        // Auto-select or normalize module for rows sharing this device
        if (parsed?.modules?.length > 0) {
          const firstModId = String(parsed.modules[0].id);
          const firstModName = parsed.modules[0].label || parsed.modules[0].name || '';
          setDynamicTemplateFields(prev => {
            return prev.map((row, i) => {
              if (String(row.deviceId) === cleanId || (rowIdx !== null && i === rowIdx)) {
                const matchedMod = findMatchingModule(parsed.modules, row);
                if (matchedMod) {
                  return {
                    ...row,
                    moduleId: String(matchedMod.id),
                    moduleName: matchedMod.label || matchedMod.name || ''
                  };
                }
                if (!row.moduleId) {
                  return {
                    ...row,
                    moduleId: firstModId,
                    moduleName: firstModName
                  };
                }
              }
              return row;
            });
          });
        }
      } else {
        setDeviceConfigs(prev => ({ ...prev, [cleanId]: { modules: [] } }));
      }
    } catch (err) {
      console.warn('[RegisterDeviceModal] loadDeviceConfig notice for device:', cleanId, err);
      setDeviceConfigs(prev => ({ ...prev, [cleanId]: { modules: [] } }));
    } finally {
      inFlightDeviceIds.current.delete(cleanId);
      setLoadingDeviceIds(prev => ({ ...prev, [cleanId]: false }));
    }
  }, [setDynamicTemplateFields]);

  // Batch preload device configurations using /config-engine/device/get/byDeviceIds
  useEffect(() => {
    if (!show) return;
    const ids = new Set();
    if (Array.isArray(dynamicTemplateFields)) {
      dynamicTemplateFields.forEach(f => {
        const dId = parseInt(f.deviceId, 10);
        if (!isNaN(dId) && dId > 0 && dId !== 101) ids.add(dId);
      });
    }
    const rawDevIds = registerForm?.sochiotDeviceIds || editingDevice?.sochiotDeviceIds;
    if (Array.isArray(rawDevIds)) {
      rawDevIds.forEach(id => { const n = parseInt(id, 10); if (!isNaN(n) && n > 0 && n !== 101) ids.add(n); });
    } else if (typeof rawDevIds === 'string' && rawDevIds.trim()) {
      rawDevIds.split(',').forEach(s => { const n = parseInt(s.trim(), 10); if (!isNaN(n) && n > 0 && n !== 101) ids.add(n); });
    }

    const unattempted = Array.from(ids).filter(id => !attemptedDeviceIds.current.has(String(id)));
    if (unattempted.length > 0) {
      unattempted.forEach(id => attemptedDeviceIds.current.add(String(id)));
      fetchDevicesByDeviceIds(unattempted).then(devs => {
        if (Array.isArray(devs) && devs.length > 0) {
          setDeviceConfigs(prev => {
            const next = { ...prev };
            devs.forEach(d => {
              if (d && d.id) {
                const parsed = extractDeviceModulesAndFields(d);
                next[String(d.id)] = parsed;
              }
            });
            return next;
          });

          // Auto-assign or normalize module for rows that have deviceId
          setDynamicTemplateFields(prev => {
            return prev.map(row => {
              const devIdStr = String(row.deviceId);
              const matchingDev = devs.find(d => String(d.id) === devIdStr);
              if (matchingDev) {
                const parsed = extractDeviceModulesAndFields(matchingDev);
                if (parsed?.modules?.length > 0) {
                  const matchedMod = findMatchingModule(parsed.modules, row);
                  if (matchedMod) {
                    return {
                      ...row,
                      moduleId: String(matchedMod.id),
                      moduleName: matchedMod.label || matchedMod.name || ''
                    };
                  }
                  if (!row.moduleId) {
                    return {
                      ...row,
                      moduleId: String(parsed.modules[0].id),
                      moduleName: parsed.modules[0].label || parsed.modules[0].name || ''
                    };
                  }
                }
              }
              return row;
            });
          });
        }
      }).catch(err => {
        console.warn('[RegisterDeviceModal] batch fetchDevicesByDeviceIds notice:', err);
      });
    }
  }, [show, editingDevice?.id, registerForm?.sochiotDeviceIds]);

  // Auto-normalize module IDs (e.g. resolve name like "CHANGE" to real module ID) whenever configs load
  useEffect(() => {
    if (!show || !Array.isArray(dynamicTemplateFields) || dynamicTemplateFields.length === 0) return;
    let changed = false;
    const updated = dynamicTemplateFields.map(row => {
      if (!row.deviceId) return row;
      const modules = deviceConfigs[String(row.deviceId)]?.modules;
      if (!Array.isArray(modules) || modules.length === 0) return row;
      const matchedMod = findMatchingModule(modules, row);
      if (matchedMod) {
        const targetId = String(matchedMod.id);
        const targetName = matchedMod.label || matchedMod.name || '';
        if (String(row.moduleId) !== targetId || (targetName && row.moduleName !== targetName)) {
          changed = true;
          return {
            ...row,
            moduleId: targetId,
            moduleName: targetName
          };
        }
      }
      return row;
    });
    if (changed) {
      setDynamicTemplateFields(updated);
    }
  }, [show, deviceConfigs, dynamicTemplateFields, setDynamicTemplateFields]);

  // Preload device configurations for any rows that already have a deviceId (at most once per cleanId)
  useEffect(() => {
    if (show && Array.isArray(dynamicTemplateFields)) {
      dynamicTemplateFields.forEach((f, idx) => {
        const dId = f.deviceId ? String(f.deviceId).trim() : '';
        if (dId && dId !== '101' && !attemptedDeviceIds.current.has(dId)) {
          loadDeviceConfig(dId, idx);
        }
      });
    }
  }, [show, dynamicTemplateFields, loadDeviceConfig]);

  useEffect(() => {
    if (show) {
      fetchAndStoreSochiotAccessToken();
    }
  }, [show]);

  const handleSelectHardwareDevice = (dev) => {
    setSelectedHardwareDevice(dev);
    if (dev) {
      setAvailableHardwareDevices(prev => {
        if (prev.some(d => String(d.id) === String(dev.id))) return prev;
        return [...prev, dev];
      });
      if (dev.id) {
        const devIdStr = String(dev.id);
        const devName = dev.name || `Device #${dev.id}`;
        setDynamicTemplateFields(prev => prev.map(f => ({
          ...f,
          deviceId: devIdStr,
          deviceName: devName
        })));
        loadDeviceConfig(devIdStr);
      }
    }
  };

  return (
    <>
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="register-wizard-drawer"
    >
      <style>{`
        /* ── Right-to-Left Slide Drawer Placement & Dimensions ── */
        .register-wizard-drawer {
          width: calc(100vw - 65px) !important;
          max-width: 100vw !important;
          height: 100vh !important;
          top: 0 !important;
          bottom: 0 !important;
          right: 0 !important;
          border: none !important;
          z-index: 1055 !important;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @media (max-width: 768px) {
          .register-wizard-drawer {
            width: 100vw !important;
          }
        }

        /* ── Base Drawer & Offcanvas Body (Dark Default) ── */
        .register-wizard-drawer,
        body:not(.light-mode) .register-wizard-drawer {
          background-color: #0f172a !important;
          background: #0f172a !important;
          color: #f8fafc !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.5) !important;
        }
        .register-wizard-drawer .offcanvas-body,
        body:not(.light-mode) .register-wizard-drawer .offcanvas-body {
          background-color: #0f172a !important;
          background: #0f172a !important;
          color: #f8fafc !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* ── Header ── */
        .register-wizard-drawer .wizard-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 36px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        .register-wizard-drawer .wizard-header-title {
          color: #f8fafc !important;
        }
        .register-wizard-drawer .wizard-close-btn {
          color: #94a3b8;
          transition: color 0.15s ease;
        }
        .register-wizard-drawer .wizard-close-btn:hover {
          color: #f8fafc;
        }

        /* ── Stepper Process Bar ── */
        .register-wizard-drawer .wizard-stepper-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 48px 12px 48px;
          gap: 18px;
          flex-shrink: 0;
        }
        .register-wizard-drawer .wizard-step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
        }
        .register-wizard-drawer .wizard-step-item.active {
          color: #38bdf8 !important;
        }
        .register-wizard-drawer .wizard-step-line {
          flex: 1;
          height: 1px;
          background-color: #334155;
          min-width: 60px;
          transition: background-color 0.2s ease;
        }
        .register-wizard-drawer .wizard-step-line.active {
          background-color: #38bdf8;
        }

        /* ── Form Body Scroll Area ── */
        .register-wizard-drawer .wizard-content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px 48px 120px 48px;
        }
        .register-wizard-drawer .location-device-filter-container {
          margin-bottom: 0 !important;
        }

        /* ── Form Labels & Inputs (Dark Default) ── */
        .register-wizard-drawer .wizard-label {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 6px;
          display: block;
        }
        .register-wizard-drawer .wizard-input,
        .register-wizard-drawer .wizard-select,
        body:not(.light-mode) .register-wizard-drawer .wizard-input,
        body:not(.light-mode) .register-wizard-drawer .wizard-select {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          height: 38px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .register-wizard-drawer textarea.wizard-input,
        body:not(.light-mode) .register-wizard-drawer textarea.wizard-input {
          height: auto !important;
        }
        .register-wizard-drawer .wizard-input:focus,
        .register-wizard-drawer .wizard-select:focus,
        body:not(.light-mode) .register-wizard-drawer .wizard-input:focus,
        body:not(.light-mode) .register-wizard-drawer .wizard-select:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
          outline: none !important;
        }
        .register-wizard-drawer .wizard-input::placeholder,
        body:not(.light-mode) .register-wizard-drawer .wizard-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
          font-size: 13px;
        }

        /* ── Table (Dark Default) ── */
        .register-wizard-drawer .table-wizard-custom {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid #334155;
          border-radius: 8px;
          overflow: visible;
        }
        .register-wizard-drawer .table-wizard-custom th {
          background-color: #1e293b;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 10px 14px;
          border-bottom: 1px solid #334155;
        }
        .register-wizard-drawer .table-wizard-custom td {
          background-color: #0f172a;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          vertical-align: middle;
          color: #f8fafc;
        }
        .register-wizard-drawer .table-wizard-custom tr:last-child td {
          border-bottom: none;
        }

        /* ── Typography & Footer (Dark Default) ── */
        .register-wizard-drawer .wizard-subheading {
          color: #f8fafc !important;
        }
        .register-wizard-drawer .wizard-muted-text {
          color: #94a3b8 !important;
        }
        .register-wizard-drawer .wizard-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 48px;
          background: #0f172a;
          flex-shrink: 0;
        }
        .register-wizard-drawer .wizard-badge {
          background-color: #1e293b;
          color: #38bdf8;
          border: 1px solid #334155;
        }
        .register-wizard-drawer .wizard-btn-add {
          border: 1px solid #38bdf8;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
        }
        .register-wizard-drawer .wizard-btn-add:hover {
          background: rgba(56, 189, 248, 0.16);
          color: #38bdf8;
        }
        .register-wizard-drawer .wizard-btn-cancel {
          background-color: #1e293b;
          border: 1px solid #334155;
          color: #cbd5e1;
          font-weight: 500;
          font-size: 13px;
          border-radius: 6px;
          padding: 7px 22px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .register-wizard-drawer .wizard-btn-cancel:hover {
          background-color: #334155;
          border-color: #475569;
          color: #ffffff;
        }
        .register-wizard-drawer .wizard-btn-primary {
          background-color: #2563eb;
          border: 1px solid #2563eb;
          color: #ffffff;
          font-weight: 500;
          font-size: 13px;
          border-radius: 6px;
          padding: 7px 24px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .register-wizard-drawer .wizard-btn-primary:hover {
          background-color: #1d4ed8;
          border-color: #1d4ed8;
        }

        /* ── Threshold Limits Action Button & Modal (Dark Default) ── */
        .btn-threshold-limits {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          border-radius: 6px !important;
          transition: all 0.15s ease !important;
          cursor: pointer !important;
        }
        .btn-threshold-limits:hover {
          background-color: rgba(245, 158, 11, 0.12) !important;
          border-color: #f59e0b !important;
          color: #fbbf24 !important;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15) !important;
        }
        .threshold-limits-chip {
          background-color: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.3);
          line-height: 1.2;
        }
        .threshold-card {
          background-color: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        }
        .threshold-label {
          color: #e2e8f0;
        }
        .threshold-input {
          background-color: #1e293b !important;
          color: #f8fafc !important;
          border: 1px solid #334155 !important;
          border-radius: 8px !important;
          height: 38px;
        }
        .threshold-input:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
        }
        /* Remove browser native number input spinners */
        .threshold-input::-webkit-outer-spin-button,
        .threshold-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .threshold-input[type=number] {
          -moz-appearance: textfield;
        }

        .threshold-section-card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
        }
        .threshold-section-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }
        .threshold-section-card.upper {
          border-top: 2px solid #f59e0b;
        }
        .threshold-section-card.lower {
          border-top: 2px solid #0ea5e9;
        }
        .threshold-section-card.flags {
          border-top: 2px solid #8b5cf6;
        }

        .alert-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .alert-dot.amber {
          background-color: #f59e0b;
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.7);
        }
        .alert-dot.red {
          background-color: #f43f5e;
          box-shadow: 0 0 6px rgba(244, 63, 94, 0.7);
        }

        .threshold-input-group .input-group-text {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-left: none !important;
          color: #94a3b8 !important;
          font-size: 11px;
          font-weight: 600;
          font-family: monospace;
          border-top-right-radius: 8px !important;
          border-bottom-right-radius: 8px !important;
        }
        .threshold-input-group .form-control {
          border-top-right-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
        }
        .threshold-input-group:focus-within .input-group-text {
          border-color: #38bdf8 !important;
        }

        .threshold-toggle-row {
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 12px 14px;
          transition: all 0.2s ease;
        }
        .threshold-toggle-row:hover {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .register-wizard-drawer .wizard-btn-primary:disabled {
          background-color: #1e3a8a;
          border-color: #1e3a8a;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* ══════════════════════════════════════════════
           ── LIGHT MODE THEME OVERRIDES ──
           ══════════════════════════════════════════════ */
        body.light-mode .register-wizard-drawer {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: #1e293b !important;
          border-left: 1px solid #e2e8f0 !important;
          box-shadow: -8px 0 25px rgba(0, 0, 0, 0.08) !important;
        }
        body.light-mode .register-wizard-drawer .offcanvas-body {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: #1e293b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-header {
          border-bottom: 1px solid #f1f5f9;
        }
        body.light-mode .register-wizard-drawer .wizard-header-title {
          color: #1e293b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-close-btn {
          color: #64748b;
        }
        body.light-mode .register-wizard-drawer .wizard-close-btn:hover {
          color: #1e293b;
        }
        body.light-mode .register-wizard-drawer .wizard-step-item {
          color: #94a3b8;
        }
        body.light-mode .register-wizard-drawer .wizard-step-item.active {
          color: #2563eb !important;
        }
        body.light-mode .register-wizard-drawer .wizard-step-line {
          background-color: #e2e8f0;
        }
        body.light-mode .register-wizard-drawer .wizard-step-line.active {
          background-color: #2563eb;
        }
        body.light-mode .register-wizard-drawer .wizard-label {
          color: #1e293b !important;
          font-weight: 600 !important;
        }
        body.light-mode .register-wizard-drawer .wizard-input,
        body.light-mode .register-wizard-drawer .wizard-select {
          background-color: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: #111827 !important;
        }
        body.light-mode .register-wizard-drawer .wizard-input:focus,
        body.light-mode .register-wizard-drawer .wizard-select:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15) !important;
        }
        body.light-mode .register-wizard-drawer .wizard-input::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }
        body.light-mode .register-wizard-drawer .table-wizard-custom {
          border: 1px solid #e2e8f0;
        }
        body.light-mode .register-wizard-drawer .table-wizard-custom th {
          background-color: #f8fafc;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }
        body.light-mode .register-wizard-drawer .table-wizard-custom td {
          background-color: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }
        body.light-mode .register-wizard-drawer .wizard-subheading {
          color: #1e293b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-muted-text {
          color: #64748b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-footer {
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
        }
        body.light-mode .register-wizard-drawer .wizard-badge {
          background-color: #f8fafc;
          color: #2563eb;
          border: 1px solid #e2e8f0;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-add {
          border: 1px solid #2563eb;
          color: #2563eb;
          background: #ffffff;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-add:hover {
          background: #eff6ff;
          color: #1d4ed8;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-cancel {
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          color: #374151;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-cancel:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
          color: #111827;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-primary {
          background-color: #2563eb;
          border: 1px solid #2563eb;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-primary:hover {
          background-color: #1d4ed8;
        }

        /* ── Threshold Limits Light Mode ── */
        body.light-mode .btn-threshold-limits {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #1e293b !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          border-radius: 6px !important;
          transition: all 0.15s ease !important;
          cursor: pointer !important;
        }
        body.light-mode .btn-threshold-limits:hover {
          background-color: #fefce8 !important;
          border-color: #f59e0b !important;
          color: #b45309 !important;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.12) !important;
        }
        body.light-mode .threshold-limits-chip {
          background-color: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
          line-height: 1.2;
        }
        body.light-mode .threshold-card {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05) !important;
        }
        body.light-mode .threshold-label {
          color: #1e293b !important;
        }
        body.light-mode .threshold-input {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          height: 38px;
        }
        body.light-mode .threshold-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15) !important;
        }
        body.light-mode .threshold-section-card {
          background: #f8fafc;
          border-color: #e2e8f0;
        }
        body.light-mode .threshold-section-card:hover {
          border-color: #cbd5e1;
        }
        body.light-mode .threshold-toggle-row {
          background: #f8fafc;
          border-color: #e2e8f0;
        }
        body.light-mode .threshold-toggle-row:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        body.light-mode .threshold-input-group .input-group-text {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #64748b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-primary:disabled {
          background-color: #93c5fd;
          border-color: #93c5fd;
          color: #ffffff;
        }
      `}</style>

      <Offcanvas.Body>
        {/* Top Header matching reference image: "✕ Register New Device" */}
        <div className="wizard-header">
          <button
            type="button"
            onClick={onHide}
            className="btn p-0 border-0 wizard-close-btn d-flex align-items-center justify-content-center"
            style={{ width: 22, height: 22 }}
            title="Close"
          >
            <X size={18} />
          </button>
          <h5 className="mb-0 fs-16 fw-semibold wizard-header-title">
            {editingDevice ? 'Edit Device' : 'Register New Device'}
          </h5>
        </div>

        {/* Stepper Bar across top: [📄 Basic] ── [📊 Template Settings] ── [🗂️ Template data] */}
        <div className="wizard-stepper-wrap">
          {/* Step 1: Basic */}
          <div
            className={`wizard-step-item ${registerStep >= 1 ? 'active' : ''}`}
            onClick={() => setRegisterStep(1)}
          >
            <FileText size={18} />
            <span className="fw-semibold">Basic</span>
          </div>

          <div className={`wizard-step-line ${registerStep > 1 ? 'active' : ''}`} />

          {/* Step 2: Template Settings / Graph */}
          <div
            className={`wizard-step-item ${registerStep === 2 ? 'active' : ''}`}
            onClick={() => {
              if (registerForm.name && registerForm.name.trim()) {
                setRegisterStep(2);
              }
            }}
          >
            <BarChart2 size={18} />
            <span className="fw-semibold">Template Settings</span>
          </div>

          <div className="wizard-step-line" />

          {/* Step 3: Template Data (Indicator matching reference) */}
          <div className="wizard-step-item" style={{ cursor: 'default' }}>
            <LayoutGrid size={18} />
            <span>Template data</span>
          </div>
        </div>

        {/* Scrollable Form Content Container */}
        <div className="wizard-content-scroll">
          {/* Step 1: Basic Information */}
          {registerStep === 1 && (
            <div>
              <Row className="g-4">
                {/* 1. Company / Site */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Company / Site *</Form.Label>
                    <Form.Select
                      disabled={!!editingDevice}
                      value={registerForm.siteId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, siteId: e.target.value, assetId: '' })}
                      className="wizard-select"
                      style={editingDevice ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                    >
                      <option value="">Select Company / Site</option>
                      {effectiveSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* 2. Asset Selector (Filtered to selected site; only active after site selection) */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Asset</Form.Label>
                    <Form.Select
                      disabled={!registerForm.siteId}
                      value={registerForm.assetId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, assetId: e.target.value })}
                      className="wizard-select"
                    >
                      {!registerForm.siteId ? (
                        <option value="">-- Select Site First --</option>
                      ) : (
                        <>
                          <option value="">Select Asset</option>
                          {(activeAssets || [])
                            .filter(a => String(a.siteId) === String(registerForm.siteId))
                            .map(a => (
                              <option key={a.id} value={a.id}>
                                {a.name} [{a.assetType || 'EQUIPMENT'}]
                              </option>
                            ))}
                        </>
                      )}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* 3. Machine Name / Device Name (Only after site selection) */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Device Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={registerForm.siteId ? "e.g. Incomer-1 LT Panel" : "Select site first"}
                      value={registerForm.name || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      disabled={!registerForm.siteId}
                      required
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col>

                {/* 4. Device Category (Only after site selection) */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Device Category *</Form.Label>
                    <Form.Select
                      value={registerForm.category || ''}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setRegisterForm({ ...registerForm, category: newCat });
                        if (newCat) {
                          const tmpl = getTemplateForCategory(newCat);
                          if (tmpl && tmpl.parameters) {
                            if (!editingDevice) {
                              const firstParam = tmpl.parameters.length > 0 ? tmpl.parameters[0] : null;
                              setDynamicTemplateFields([{
                                displayName: firstParam?.name || '',
                                required: Boolean(firstParam?.required),
                                deviceId: '',
                                deviceName: '',
                                deviceVal: null,
                                moduleId: '',
                                moduleName: '',
                                sochiotFieldName: '',
                                thresholdValue: '',
                                warningHigh: null,
                                criticalHigh: null,
                                warningLow: null,
                                criticalLow: null,
                                dataType: firstParam?.dataType || 'INTEGER',
                                unit: firstParam?.unit || '',
                                isCommand: false,
                                graphable: true,
                                isTelemetry: true,
                                isCumulative: firstParam ? isCumulativeMetric({ displayName: firstParam.name, unit: firstParam.unit }) : false,
                                isActive: true
                              }]);
                            }
                          }
                        }
                      }}
                      disabled={!registerForm.siteId}
                      className="wizard-select"
                      required
                    >
                      <option value="">Select Device Category</option>
                      {DEVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* 5. Serial Number (Only after site selection) */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Serial Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={registerForm.siteId ? "e.g. SN-492019" : "Select site first"}
                      value={registerForm.serialNumber || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, serialNumber: e.target.value })}
                      disabled={!registerForm.siteId}
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col>

                {/* 6. Description / Location Notes (Only after site selection) */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      placeholder={registerForm.siteId ? "e.g. Ground floor plant room..." : "Select site first"}
                      value={registerForm.description || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                      disabled={!registerForm.siteId}
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col>

                {/* Location Hierarchy & Grouping */}
                {/* <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Building / Block (Optional)</Form.Label>
                    <Form.Select
                      value={registerForm.buildingId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, buildingId: e.target.value })}
                      disabled={!registerForm.siteId}
                      className="wizard-select"
                    >
                      <option value="">Select Building</option>
                      {activeBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col> */}

                {/* <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Area (Optional)</Form.Label>
                    <Form.Select
                      value={registerForm.areaId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, areaId: e.target.value })}
                      disabled={!registerForm.siteId}
                      className="wizard-select"
                    >
                      <option value="">Select Area</option>
                      {activeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col> */}

                {/* <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Energy Group (Optional)</Form.Label>
                    <Form.Select
                      value={registerForm.energyGroupId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, energyGroupId: e.target.value })}
                      disabled={!registerForm.siteId}
                      className="wizard-select"
                    >
                      <option value="">Select Energy Group</option>
                      <option value="1">Substation Main Metering</option>
                      <option value="2">HVAC Chiller Loop</option>
                    </Form.Select>
                  </Form.Group>
                </Col> */}
{/* 
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Floor Number (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 3"
                      value={registerForm.floorNo || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, floorNo: e.target.value })}
                      disabled={!registerForm.siteId}
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col> */}

                {/* <Col md={6}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Room Number (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 302"
                      value={registerForm.roomNo || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, roomNo: e.target.value })}
                      disabled={!registerForm.siteId}
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col> */}
              </Row>
            </div>
          )}

          {/* Step 2: Template Settings */}
          {registerStep === 2 && (
            <div className="d-flex flex-column gap-3">
              {/* Sochiot Location Search Filter (Single Location Selector) */}
              <div className="py-1 px-0">
                <div className="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-13 fw-semibold wizard-subheading">
                      Search Location
                    </span>
                    <span className="badge bg-secondary bg-opacity-30 text-info border border-info border-opacity-25 fs-11 fw-normal">
                      Sochiot Cloud &amp; BMS
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {registerForm.category && (
                      <span className="badge bg-primary bg-opacity-20 text-info border border-info border-opacity-25 fs-11 fw-normal">
                        Category: {formatCategoryLabel(registerForm.category)}
                      </span>
                    )}
                    <span className="badge wizard-badge px-2.5 py-1 fs-11 font-monospace">
                      {dynamicTemplateFields.length} FIELD{dynamicTemplateFields.length !== 1 ? 'S' : ''}
                    </span>
                  </div>
                </div>
                <LocationDeviceFilter
                  showTitle={false}
                  companies={companies}
                  tenants={tenants}
                  zones={zones}
                  areas={activeAreas}
                  sites={effectiveSites}
                  enableDeviceFilter={false}
                  className="mb-0"
                  initialLocationValue={registerForm.sochiotLocationId ? `LOCATION-${registerForm.sochiotLocationId}` : (registerForm.siteId ? `LOCATION-${registerForm.siteId}` : null)}
                  onSelectLocation={(loc) => {
                    if (loc?.id) {
                      setRegisterForm(prev => ({ ...prev, sochiotLocationId: String(loc.id), sochiotLocationName: loc.name || '' }));
                    }
                  }}
                  onDeviceTreeLoaded={handleDeviceTreeLoaded}
                />
              </div>

              <div className="table-responsive" style={{ overflow: 'visible' }}>
                <table className="table-wizard-custom" style={{ overflow: 'visible' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Display Name</th>
                      <th style={{ width: '24%' }}>Gateway &amp; Device</th>
                      <th style={{ width: '18%' }}>Module ID</th>
                      <th style={{ width: '18%' }}>Event Field</th>
                      <th style={{ width: '18%' }}>Threshold Limits</th>
                      <th style={{ width: '40px' }} className="text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicTemplateFields.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-slate-400 fs-13">
                          <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                            <span className="fw-medium text-slate-300">No telemetry fields added yet.</span>
                            <span className="fs-12 text-slate-500">Click <strong>+ Add Field</strong> below to add and configure device telemetry fields.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      dynamicTemplateFields.map((f, idx) => (
                      <tr key={idx}>
                        {/* 1. Display Name (Template Parameter Selector / Editable) */}
                        <td>
                          {(() => {
                            const tmpl = getTemplateForCategory(registerForm?.category || editingDevice?.category || 'ENERGY_METER');
                            const templateParams = tmpl?.parameters || [];
                            const isCustom = Boolean(f.isCustomDisplayName);

                            return (
                              <div className="d-flex align-items-center gap-1 w-100 position-relative">
                                {!isCustom ? (
                                  <Form.Select
                                    size="sm"
                                    value={f.displayName || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '__custom__') {
                                        const copy = [...dynamicTemplateFields];
                                        copy[idx].isCustomDisplayName = true;
                                        setDynamicTemplateFields(copy);
                                        return;
                                      }
                                      const copy = [...dynamicTemplateFields];
                                      const matchedParam = templateParams.find(p => p.name === val);
                                      copy[idx].displayName = val;
                                      if (matchedParam) {
                                        copy[idx].required = Boolean(matchedParam.required);
                                        if (matchedParam.unit) copy[idx].unit = matchedParam.unit;
                                        if (matchedParam.dataType) copy[idx].dataType = matchedParam.dataType;
                                        copy[idx].isCumulative = isCumulativeMetric({ displayName: val, unit: matchedParam.unit || copy[idx].unit });
                                      }
                                      setDynamicTemplateFields(copy);
                                    }}
                                    className="wizard-select text-truncate"
                                    style={{ height: 32, fontSize: 12 }}
                                  >
                                    <option value="">Select Parameter</option>
                                    {templateParams.length > 0 && (
                                      <optgroup label={`${tmpl?.label || 'Template'} Parameters`}>
                                        {templateParams.map(p => (
                                          <option key={p.name} value={p.name}>
                                            {p.name}{p.required ? ' *' : ''}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                    {f.displayName && !templateParams.some(p => p.name === f.displayName) && (
                                      <optgroup label="Current Setting">
                                        <option value={f.displayName}>{f.displayName}</option>
                                      </optgroup>
                                    )}
                                    <option value="__custom__">+ Enter Custom Name...</option>
                                  </Form.Select>
                                ) : (
                                  <div className="d-flex align-items-center w-100 gap-1">
                                    <Form.Control
                                      size="sm"
                                      type="text"
                                      value={f.displayName || ''}
                                      placeholder="Custom Parameter Name"
                                      onChange={(e) => {
                                        const copy = [...dynamicTemplateFields];
                                        copy[idx].displayName = e.target.value;
                                        setDynamicTemplateFields(copy);
                                      }}
                                      className="wizard-input text-slate-100 w-100 text-truncate"
                                      style={{ height: 32, fontSize: 12 }}
                                    />
                                    <button
                                      type="button"
                                      title="Select from template parameters"
                                      onClick={() => {
                                        const copy = [...dynamicTemplateFields];
                                        copy[idx].isCustomDisplayName = false;
                                        setDynamicTemplateFields(copy);
                                      }}
                                      className="btn btn-sm btn-outline-info p-0 px-1.5 flex-shrink-0"
                                      style={{ height: 32, fontSize: 11 }}
                                    >
                                      List
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* 2. Gateway & Device */}
                        <td>
                          <LocationCascaderSelector
                            options={hardwareDeviceTree}
                            value={f.deviceVal || f.deviceId}
                            fallbackLabel={f.deviceName || (f.deviceId && f.deviceId !== '101' ? `Device #${f.deviceId}` : (f.deviceId === '101' ? `101 (${registerForm.name || 'Default'})` : ''))}
                            onChange={(valArray, pathNodes, leafNode) => {
                              if (leafNode) {
                                const parsed = parseLocationValue(leafNode.value);
                                const selectedId = String(parsed?.id || leafNode.id);
                                const selectedName = leafNode.label;
                                const cachedConfig = deviceConfigs[selectedId];
                                const defaultModId = cachedConfig?.modules?.length > 0 ? String(cachedConfig.modules[0].id) : '';
                                const defaultModName = cachedConfig?.modules?.length > 0 ? (cachedConfig.modules[0].label || cachedConfig.modules[0].name || '') : '';

                                setDynamicTemplateFields(prev => {
                                  return prev.map((row, rIdx) => {
                                    const nextRow = { ...row };
                                    nextRow.deviceId = selectedId;
                                    nextRow.deviceName = selectedName;
                                    nextRow.deviceVal = valArray;
                                    if (cachedConfig?.modules?.length > 0) {
                                      const matched = findMatchingModule(cachedConfig.modules, nextRow);
                                      if (matched) {
                                        nextRow.moduleId = String(matched.id);
                                        nextRow.moduleName = matched.label || matched.name || '';
                                      } else if (!nextRow.moduleId && defaultModId) {
                                        nextRow.moduleId = defaultModId;
                                        nextRow.moduleName = defaultModName;
                                      }
                                    } else if (!nextRow.moduleId && defaultModId) {
                                      nextRow.moduleId = defaultModId;
                                      nextRow.moduleName = defaultModName;
                                    }
                                    if (rIdx === idx) {
                                      nextRow.sochiotFieldName = '';
                                      nextRow.isManualEntry = false;
                                    }
                                    return nextRow;
                                  });
                                });
                                loadDeviceConfig(selectedId, idx);
                              } else {
                                setDynamicTemplateFields(prev => {
                                  return prev.map((row, rIdx) => {
                                    if (rIdx === idx) {
                                      return {
                                        ...row,
                                        deviceId: '',
                                        deviceName: '',
                                        deviceVal: null,
                                        moduleId: '',
                                        moduleName: '',
                                        sochiotFieldName: '',
                                        isManualEntry: false
                                      };
                                    }
                                    return row;
                                  });
                                });
                              }
                            }}
                            changeOnSelect={true}
                            displayOnlyChild={true}
                            placeholder="Select Device"
                            searchPlaceholder="Search gateway / device..."
                            variant="compact"
                            allowClear={true}
                            triggerIcon={<Cpu size={13} className="text-info flex-shrink-0" />}
                          />
                        </td>

                        {/* 3. Module ID */}
                        <td>
                          {(() => {
                            const devConfig = deviceConfigs[f.deviceId];
                            const isLoadingModules = loadingDeviceIds[f.deviceId];
                            const modules = devConfig?.modules || [];
                            const matchedMod = findMatchingModule(modules, f);
                            const currentModId = matchedMod ? String(matchedMod.id) : (f.moduleId ? String(f.moduleId) : '');

                            return (
                              <Form.Select
                                size="sm"
                                value={currentModId || ''}
                                disabled={!f.deviceId || isLoadingModules}
                                onChange={(e) => {
                                  const newModuleId = e.target.value;
                                  const copy = [...dynamicTemplateFields];
                                  const selectedMod = modules.find(m => String(m.id) === String(newModuleId));
                                  copy[idx].moduleId = newModuleId;
                                  copy[idx].moduleName = selectedMod ? (selectedMod.label || selectedMod.name || '') : (copy[idx].moduleName || '');
                                  copy[idx].sochiotFieldName = '';
                                  // Preserve existing displayName - only manually editable
                                  copy[idx].isManualEntry = false;
                                  setDynamicTemplateFields(copy);
                                }}
                                className="wizard-select"
                                style={{ height: 32, fontSize: 12 }}
                              >
                                {!f.deviceId ? (
                                  <option value="">Select Device First</option>
                                ) : isLoadingModules && !currentModId ? (
                                  <option value="">Loading modules...</option>
                                ) : modules.length === 0 ? (
                                  <>
                                    <option value="">No modules found</option>
                                    {currentModId && (
                                      <option value={String(currentModId)}>
                                        {f.moduleName || f.deviceName || `Module #${currentModId}`}
                                      </option>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <option value="">Select Module</option>
                                    {modules.map(m => {
                                      const cleanLabel = (m.label || m.name || '').replace(/\s*\((general|other)\)/gi, '').replace(/\b(general|other)\b/gi, '').trim() || m.name;
                                      return (
                                        <option key={m.id} value={String(m.id)}>
                                          {cleanLabel}
                                        </option>
                                      );
                                    })}
                                    {currentModId && !modules.some(m => String(m.id) === String(currentModId)) && (
                                      <option value={String(currentModId)}>
                                        {f.moduleName || f.deviceName || `Module #${currentModId}`}
                                      </option>
                                    )}
                                  </>
                                )}
                              </Form.Select>
                            );
                          })()}
                        </td>

                        {/* 4. Event Field */}
                        <td>
                          {(() => {
                            const devConfig = deviceConfigs[f.deviceId];
                            const modules = devConfig?.modules || [];
                            const selectedModule = findMatchingModule(modules, f);
                            const eventFields = selectedModule?.eventFields || [];
                            const settingFields = selectedModule?.settingFields || [];
                            const hasFields = eventFields.length > 0 || settingFields.length > 0;
                            const isCustomEntry = Boolean(f.isManualEntry);

                            return (
                              <div className="d-flex align-items-center gap-1 w-100">
                                {hasFields && !isCustomEntry ? (
                                  <Form.Select
                                    size="sm"
                                    value={f.sochiotFieldName || ''}
                                    disabled={!f.moduleId && !selectedModule}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '__custom__') {
                                        const copy = [...dynamicTemplateFields];
                                        copy[idx].isManualEntry = true;
                                        copy[idx].sochiotFieldName = '';
                                        copy[idx].sochiotFieldId = null;
                                        copy[idx].fieldId = null;
                                        setDynamicTemplateFields(copy);
                                        return;
                                      }
                                      const copy = [...dynamicTemplateFields];
                                      copy[idx].sochiotFieldName = val;
                                      copy[idx].isManualEntry = false;
                                      // Match against selectedModule fields to capture IDs and meta
                                      const matched = selectedModule?.allFields?.find(af => af.fieldName === val);
                                      if (matched) {
                                        const matchedId = (matched.id && !isNaN(Number(matched.id)))
                                          ? Number(matched.id)
                                          : ((matched.mappingId && !isNaN(Number(matched.mappingId))) ? Number(matched.mappingId) : null);
                                        copy[idx].sochiotFieldId = matchedId;
                                        copy[idx].fieldId = matchedId;
                                        if (matched.eventId) copy[idx].eventId = matched.eventId;
                                        if (matched.eventKey) copy[idx].eventKey = matched.eventKey;
                                        if (!copy[idx].displayName || !copy[idx].displayName.trim()) {
                                          copy[idx].displayName = matched.displayName || matched.fieldName;
                                        }
                                        if (matched.unit) copy[idx].unit = matched.unit;
                                        if (matched.dataType) copy[idx].dataType = matched.dataType;
                                        if (matched.multiplier) copy[idx].multiplier = matched.multiplier;
                                      } else {
                                        copy[idx].sochiotFieldId = null;
                                        copy[idx].fieldId = null;
                                      }
                                      setDynamicTemplateFields(copy);
                                    }}
                                    className="wizard-select font-monospace"
                                    style={{ height: 32, fontSize: 12 }}
                                  >
                                    <option value="">Select Event / Setting Field</option>
                                    {eventFields.length > 0 && (
                                      <optgroup label="Events Fields">
                                        {eventFields.map(ef => {
                                          const displayLabel = ef.displayName || ef.fieldName;
                                          const unitText = ef.unit ? ` (${ef.unit})` : '';
                                          return (
                                            <option key={ef.id} value={ef.fieldName}>
                                              {displayLabel}{unitText}
                                            </option>
                                          );
                                        })}
                                      </optgroup>
                                    )}
                                    {settingFields.length > 0 && (
                                      <optgroup label="Setting Fields">
                                        {settingFields.map(sf => {
                                          const displayLabel = sf.displayName || sf.fieldName;
                                          const unitText = sf.unit ? ` (${sf.unit})` : '';
                                          return (
                                            <option key={sf.mappingId || sf.id} value={sf.fieldName}>
                                              {displayLabel}{unitText}
                                            </option>
                                          );
                                        })}
                                      </optgroup>
                                    )}
                                    {f.sochiotFieldName && !selectedModule?.allFields?.some(af => af.fieldName === f.sochiotFieldName) && (
                                      <option value={f.sochiotFieldName}>
                                        {f.displayName || f.sochiotFieldName}
                                      </option>
                                    )}
                                    <option value="__custom__">+ Enter Custom Field...</option>
                                  </Form.Select>
                                ) : (
                                  <div className="d-flex align-items-center w-100 gap-1">
                                    <Form.Control
                                      size="sm"
                                      type="text"
                                      placeholder={(f.moduleId || selectedModule) ? "e.g. OFF_TIME or 3,100F" : (!f.deviceId ? "Select Device First" : "Select Module First")}
                                      value={f.sochiotFieldName || ''}
                                      disabled={!f.moduleId && !selectedModule}
                                      onChange={(e) => {
                                        const copy = [...dynamicTemplateFields];
                                        const manualVal = e.target.value;
                                        copy[idx].sochiotFieldName = manualVal;
                                        const matched = selectedModule?.allFields?.find(af => af.fieldName === manualVal);
                                        if (matched) {
                                          const matchedId = (matched.id && !isNaN(Number(matched.id)))
                                            ? Number(matched.id)
                                            : ((matched.mappingId && !isNaN(Number(matched.mappingId))) ? Number(matched.mappingId) : null);
                                          copy[idx].sochiotFieldId = matchedId;
                                          copy[idx].fieldId = matchedId;
                                          if (matched.eventId) copy[idx].eventId = matched.eventId;
                                          if (matched.eventKey) copy[idx].eventKey = matched.eventKey;
                                        }
                                        setDynamicTemplateFields(copy);
                                      }}
                                      className="wizard-input font-monospace"
                                      style={{ height: 32, fontSize: 12 }}
                                    />
                                    {hasFields && (
                                      <button
                                        type="button"
                                        title="Select from module fields list"
                                        onClick={() => {
                                          const copy = [...dynamicTemplateFields];
                                          copy[idx].isManualEntry = false;
                                          setDynamicTemplateFields(copy);
                                        }}
                                        className="btn btn-sm btn-outline-info p-0 px-1.5 flex-shrink-0"
                                        style={{ height: 32, fontSize: 11 }}
                                      >
                                        List
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* 5. Threshold Limits */}
                        <td>
                          {(() => {
                            const hasLimits = (f.warningHigh !== null && f.warningHigh !== undefined && f.warningHigh !== '') ||
                                              (f.criticalHigh !== null && f.criticalHigh !== undefined && f.criticalHigh !== '');
                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenThresholdModal(idx)}
                                className="btn btn-threshold-limits d-flex align-items-center justify-content-between gap-1.5 px-2.5 rounded-2 w-100 text-nowrap"
                                style={{ height: 32 }}
                                title={hasLimits ? `Threshold Boundaries:\nWarning: ${f.warningHigh ?? '-'} (High) / ${f.warningLow ?? '-'} (Low)\nCritical: ${f.criticalHigh ?? '-'} (High) / ${f.criticalLow ?? '-'} (Low)` : 'Click to configure optional threshold limits'}
                              >
                                <div className="d-flex align-items-center gap-1.5 overflow-hidden">
                                  <Sliders size={13} className="text-warning flex-shrink-0" />
                                  <span className="fs-12 fw-semibold">Threshold Limits</span>
                                  {isCumulativeMetric(f) && (
                                    <span className="badge bg-info bg-opacity-25 text-info fs-10 px-1 py-0.5 rounded font-monospace" title="Cumulative Metric (Indefinite accumulation for delta math)">
                                      Σ
                                    </span>
                                  )}
                                </div>
                                <span className={`threshold-limits-chip font-monospace fs-10 px-1.5 py-0.5 rounded flex-shrink-0 ${!hasLimits ? 'opacity-75' : ''}`}>
                                  {hasLimits ? `${f.warningHigh ?? '-'}/${f.criticalHigh ?? '-'}` : 'Optional'}
                                </span>
                              </button>
                            );
                          })()}
                        </td>

                        {/* 6. Remove action */}
                        <td className="text-center">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              if (dynamicTemplateFields.length <= 1) {
                                const copy = [...dynamicTemplateFields];
                                copy[0] = {
                                  ...copy[0],
                                  displayName: '',
                                  sochiotFieldName: '',
                                  moduleId: '',
                                  moduleName: '',
                                  warningHigh: null,
                                  criticalHigh: null,
                                  warningLow: null,
                                  criticalLow: null
                                };
                                setDynamicTemplateFields(copy);
                                return;
                              }
                              setDynamicTemplateFields(dynamicTemplateFields.filter((_, i) => i !== idx));
                            }}
                            className="p-1 border-0 text-danger"
                            title="Remove Field"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>

                {/* Add Field Button */}
                <div className="mt-2 text-start">
                  <button
                    type="button"
                    onClick={() => {
                      const lastField = dynamicTemplateFields[dynamicTemplateFields.length - 1];
                      const defaultDev = lastField?.deviceId || '';
                      const defaultDevName = lastField?.deviceName || '';
                      const defaultDevVal = lastField?.deviceVal || null;
                      const defaultModuleId = lastField?.moduleId || '';
                      const defaultModuleName = lastField?.moduleName || '';

                      const tmpl = getTemplateForCategory(registerForm?.category || editingDevice?.category || 'ENERGY_METER');
                      const existingNames = new Set((dynamicTemplateFields || []).map(f => (f.displayName || '').trim().toLowerCase()));
                      const nextParam = (tmpl?.parameters || []).find(p => !existingNames.has((p.name || '').trim().toLowerCase())) || null;

                      setDynamicTemplateFields([
                        ...dynamicTemplateFields,
                        {
                          deviceId: defaultDev,
                          deviceName: defaultDevName,
                          deviceVal: defaultDevVal,
                          moduleId: defaultModuleId,
                          moduleName: defaultModuleName,
                          sochiotFieldName: '',
                          displayName: nextParam?.name || '',
                          isManualEntry: false,
                          required: Boolean(nextParam?.required),
                          thresholdValue: '',
                          warningHigh: null,
                          criticalHigh: null,
                          warningLow: null,
                          criticalLow: null,
                          dataType: nextParam?.dataType || 'INTEGER',
                          unit: nextParam?.unit || '',
                          isCommand: false,
                          graphable: true,
                          isTelemetry: true,
                          isCumulative: nextParam ? isCumulativeMetric({ displayName: nextParam.name, unit: nextParam.unit }) : false,
                          isActive: true
                        }
                      ]);
                    }}
                    className="wizard-btn-add d-inline-flex align-items-center gap-1 px-3 py-1.5 fs-12 fw-medium rounded-2 border-0"
                  >
                    <Plus size={14} /> Add Field
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Controls */}
        <div className="d-flex align-items-center justify-content-end gap-2.5 wizard-footer">
          <button
            type="button"
            onClick={onHide}
            className="wizard-btn-cancel"
          >
            Cancel
          </button>

          {registerStep === 2 && (
            <button
              type="button"
              onClick={() => setRegisterStep(1)}
              className="wizard-btn-cancel"
            >
              Back
            </button>
          )}

          {registerStep === 1 ? (
            <button
              type="button"
              onClick={() => {
                if (!registerForm.siteId) {
                  return showToast('warning', 'Please select a Company / Site first');
                }
                if (!registerForm.name || !registerForm.name.trim()) {
                  return showToast('warning', 'Device Name is required to proceed to Template Settings');
                }
                // Auto-populate from central template if fields are uninitialized
                const tmpl = getTemplateForCategory(registerForm.category || 'ENERGY_METER');
                const isPristine = !dynamicTemplateFields || dynamicTemplateFields.length === 0 ||
                  (dynamicTemplateFields.length === 1 && !dynamicTemplateFields[0].displayName && !dynamicTemplateFields[0].deviceId);

                const defaultDev = (dynamicTemplateFields || []).find(f => f.deviceId && String(f.deviceId).trim() !== '' && String(f.deviceId) !== '101')?.deviceId || (registerForm.sochiotDeviceIds ? String(registerForm.sochiotDeviceIds).split(',')[0].trim() : '');
                const defaultDevName = (dynamicTemplateFields || []).find(f => f.deviceName)?.deviceName || (defaultDev ? `Device #${defaultDev}` : '');
                const defaultDevVal = (dynamicTemplateFields || []).find(f => f.deviceVal)?.deviceVal || null;
                const defaultModuleId = (dynamicTemplateFields || []).find(f => f.moduleId)?.moduleId || '';
                const defaultModuleName = (dynamicTemplateFields || []).find(f => f.moduleName)?.moduleName || '';

                if (!editingDevice && isPristine) {
                  if (typeof setDynamicTemplateFields === 'function') {
                    const firstParam = (tmpl?.parameters && tmpl.parameters.length > 0) ? tmpl.parameters[0] : null;
                    setDynamicTemplateFields([{
                      displayName: firstParam?.name || '',
                      required: Boolean(firstParam?.required),
                      deviceId: defaultDev,
                      deviceName: defaultDevName,
                      deviceVal: defaultDevVal,
                      moduleId: defaultModuleId,
                      moduleName: defaultModuleName,
                      sochiotFieldName: '',
                      thresholdValue: '',
                      warningHigh: null,
                      criticalHigh: null,
                      warningLow: null,
                      criticalLow: null,
                      dataType: firstParam?.dataType || 'INTEGER',
                      unit: firstParam?.unit || '',
                      isCommand: false,
                      graphable: true,
                      isTelemetry: true,
                      isCumulative: firstParam ? isCumulativeMetric({ displayName: firstParam.name, unit: firstParam.unit }) : false,
                      isActive: true
                    }]);
                  }
                } else if (!dynamicTemplateFields || dynamicTemplateFields.length === 0) {
                  if (typeof setDynamicTemplateFields === 'function') {
                    const firstParam = (tmpl?.parameters && tmpl.parameters.length > 0) ? tmpl.parameters[0] : null;
                    setDynamicTemplateFields([{
                      deviceId: defaultDev,
                      deviceName: defaultDevName,
                      deviceVal: defaultDevVal,
                      moduleId: defaultModuleId,
                      moduleName: defaultModuleName,
                      sochiotFieldName: '',
                      displayName: firstParam?.name || '',
                      required: Boolean(firstParam?.required),
                      thresholdValue: '',
                      warningHigh: null,
                      criticalHigh: null,
                      warningLow: null,
                      criticalLow: null,
                      dataType: firstParam?.dataType || 'INTEGER',
                      unit: firstParam?.unit || '',
                      isCommand: false,
                      graphable: true,
                      isTelemetry: true,
                      isCumulative: firstParam ? isCumulativeMetric({ displayName: firstParam.name, unit: firstParam.unit }) : false,
                      isActive: true
                    }]);
                  }
                }
                fetchAndStoreSochiotAccessToken();
                setRegisterStep(2);
              }}
              className="wizard-btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                if (!registerForm.name || !registerForm.name.trim()) {
                  if (typeof showToast === 'function') showToast('danger', 'Device Name is required');
                  return;
                }

                const resolvedSiteId = registerForm.siteId 
                  || (editingDevice && (editingDevice.siteId || editingDevice.site?.id || editingDevice.site_id))
                  || (selectedSiteFilter && selectedSiteFilter !== 'ALL' ? String(selectedSiteFilter) : '')
                  || (effectiveSites && effectiveSites.length > 0 ? String(effectiveSites[0].id) : '');

                if (!resolvedSiteId) {
                  if (typeof showToast === 'function') showToast('danger', 'Company / Site is required. Please select a site in Basic information.');
                  return;
                }

                // Extract unique Sochiot hardware device IDs from dynamicTemplateFields
                const fieldDeviceIds = (dynamicTemplateFields || [])
                  .map(f => parseInt(f.deviceId, 10))
                  .filter(n => !isNaN(n) && n > 0 && n !== 101);
                let parsedSochiotIds = Array.from(new Set(fieldDeviceIds));

                if (parsedSochiotIds.length === 0 && registerForm.sochiotDeviceIds) {
                  parsedSochiotIds = String(registerForm.sochiotDeviceIds)
                    .split(',')
                    .map(id => parseInt(id.trim(), 10))
                    .filter(n => !isNaN(n) && n > 0 && n !== 101);
                }

                if (parsedSochiotIds.length === 0 && editingDevice?.sochiotDeviceIds) {
                  const existing = Array.isArray(editingDevice.sochiotDeviceIds)
                    ? editingDevice.sochiotDeviceIds
                    : [editingDevice.sochiotDeviceIds];
                  parsedSochiotIds = existing
                    .map(id => parseInt(id, 10))
                    .filter(n => !isNaN(n) && n > 0 && n !== 101);
                }

                if (!editingDevice && parsedSochiotIds.length === 0) {
                  if (typeof showToast === 'function') {
                    showToast('danger', 'Please select at least one hardware device in Template Settings.');
                  }
                  return;
                }

                // Filter valid telemetry fields: only create setting body items for rows where event field was chosen!
                const validFields = (dynamicTemplateFields || []).filter(f => {
                  const matchedMod = findMatchingModule(deviceConfigs[f.deviceId]?.modules, f);
                  return f && f.sochiotFieldName && String(f.sochiotFieldName).trim() !== '' && (f.moduleId || matchedMod);
                });

                if (!editingDevice && validFields.length === 0) {
                  if (typeof showToast === 'function') {
                    showToast('danger', 'Please configure at least one telemetry field by choosing an Event Field.');
                  }
                  return;
                }

                // Extract unique module IDs from validFields, dynamicTemplateFields, and registerForm
                const fieldModuleIds = (validFields || [])
                  .map(f => {
                    const matchedMod = findMatchingModule(deviceConfigs[f.deviceId]?.modules, f);
                    return parseInt(matchedMod ? matchedMod.id : f.moduleId, 10);
                  })
                  .filter(m => !isNaN(m) && m > 0);

                const dynamicModuleIds = (dynamicTemplateFields || [])
                  .map(f => {
                    const matchedMod = findMatchingModule(deviceConfigs[f.deviceId]?.modules, f);
                    return parseInt(matchedMod ? matchedMod.id : f.moduleId, 10);
                  })
                  .filter(m => !isNaN(m) && m > 0);

                const formModuleIds = Array.isArray(registerForm?.moduleIds)
                  ? registerForm.moduleIds.map(m => parseInt(m, 10)).filter(m => !isNaN(m) && m > 0)
                  : (registerForm?.moduleIds ? String(registerForm.moduleIds).split(',').map(m => parseInt(m.trim(), 10)).filter(m => !isNaN(m) && m > 0) : []);

                const parsedModuleIds = Array.from(new Set([...fieldModuleIds, ...dynamicModuleIds, ...formModuleIds]));

                const templateSettings = validFields.map((f, idx) => {
                  const matchedMod = findMatchingModule(deviceConfigs[f.deviceId]?.modules, f);
                  const rawModId = matchedMod ? matchedMod.id : f.moduleId;
                  const mId = parseInt(rawModId, 10);
                  const parsedMeta = f.meta 
                    ? (typeof f.meta === 'string' ? JSON.parse(f.meta) : f.meta)
                    : (f.multiplier ? { multiplier: parseFloat(f.multiplier) } : null);

                  const matchedFieldDef = matchedMod?.allFields?.find(af => af.fieldName === f.sochiotFieldName);
                  const fallbackFieldId = (matchedFieldDef?.id && !isNaN(Number(matchedFieldDef.id)))
                    ? Number(matchedFieldDef.id)
                    : ((matchedFieldDef?.mappingId && !isNaN(Number(matchedFieldDef.mappingId))) ? Number(matchedFieldDef.mappingId) : null);

                  const resolvedFieldId = (f.fieldId && !isNaN(Number(f.fieldId)))
                    ? Number(f.fieldId)
                    : ((f.sochiotFieldId && !isNaN(Number(f.sochiotFieldId)))
                      ? Number(f.sochiotFieldId)
                      : ((f.mappingId && !isNaN(Number(f.mappingId)))
                        ? Number(f.mappingId)
                        : (fallbackFieldId !== null ? fallbackFieldId : null)));

                  const resolvedSochiotFieldId = (f.sochiotFieldId && !isNaN(Number(f.sochiotFieldId)))
                    ? Number(f.sochiotFieldId)
                    : (resolvedFieldId !== null ? resolvedFieldId : fallbackFieldId);

                  const resolvedEventId = (f.eventId && !isNaN(Number(f.eventId)))
                    ? Number(f.eventId)
                    : (matchedFieldDef?.eventId ? Number(matchedFieldDef.eventId) : null);

                  const resolvedEventKey = f.eventKey
                    ? String(f.eventKey).trim()
                    : (matchedFieldDef?.eventKey ? String(matchedFieldDef.eventKey).trim() : null);

                  return {
                    // Golden Rule 1: Include database id for existing settings; omit for new ones
                    ...(typeof f.id === 'number' && f.id > 0 ? { id: f.id } : {}),
                    moduleId: !isNaN(mId) && mId > 0 ? mId : 0,
                    moduleName: String(matchedMod?.label || matchedMod?.name || f.moduleName || f.deviceName || '').trim() || null,
                    fieldId: resolvedFieldId,
                    sochiotFieldId: resolvedSochiotFieldId,
                    // Note: graphId omitted per backend validation ("for now dont send the graphID or send zero")
                    eventId: resolvedEventId,
                    eventKey: f.eventKey ? String(f.eventKey).trim() : null,
                    deviceName: String(f.deviceName || '').trim() || null,
                    sochiotFieldName: String(f.sochiotFieldName || '').trim(),
                    displayName: String(f.displayName || f.sochiotFieldName || '').trim(),
                    dataType: (f.dataType && ['INTEGER', 'FLOAT', 'BOOLEAN', 'STRING', 'ENUM'].includes(String(f.dataType).toUpperCase())) ? String(f.dataType).toUpperCase() : 'INTEGER',
                    unit: f.unit ? String(f.unit).trim() : null,
                    displayOrder: (f.displayOrder !== undefined && f.displayOrder !== null && !isNaN(Number(f.displayOrder))) ? Number(f.displayOrder) : idx + 1,
                    enumValues: Array.isArray(f.enumValues) ? f.enumValues : [],
                    warningHigh: (f.warningHigh !== '' && f.warningHigh !== null && f.warningHigh !== undefined && !isNaN(Number(f.warningHigh))) ? Number(f.warningHigh) : null,
                    criticalHigh: (f.criticalHigh !== '' && f.criticalHigh !== null && f.criticalHigh !== undefined && !isNaN(Number(f.criticalHigh))) ? Number(f.criticalHigh) : null,
                    warningLow: (f.warningLow !== '' && f.warningLow !== null && f.warningLow !== undefined && !isNaN(Number(f.warningLow))) ? Number(f.warningLow) : null,
                    criticalLow: (f.criticalLow !== '' && f.criticalLow !== null && f.criticalLow !== undefined && !isNaN(Number(f.criticalLow))) ? Number(f.criticalLow) : null,
                    isTelemetry: f.isTelemetry !== false,
                    isCumulative: isCumulativeMetric(f),
                    isCommand: Boolean(f.isCommand),
                    commandAlias: f.commandAlias ? String(f.commandAlias).trim() : null,
                    isReadable: f.isReadable !== false,
                    isDisplayed: f.isDisplayed !== false,
                    graphable: f.graphable !== false,
                    isActive: f.isActive !== false,
                    meta: parsedMeta
                  };
                });


                const existingRules = Array.isArray(registerForm?.rules) && registerForm.rules.length > 0
                  ? registerForm.rules
                  : (Array.isArray(editingDevice?.rules) ? editingDevice.rules : []);

                const formattedRules = existingRules.map(r => ({
                  name: r.name,
                  description: r.description || null,
                  ruleType: r.ruleType || 'ALARM',
                  priority: r.priority || 1,
                  isActive: r.isActive !== false,
                  sochiotModuleId: r.sochiotModuleId || null,
                  fields: Array.isArray(r.fields) ? r.fields.map((rf, fIdx) => ({
                    fieldName: rf.fieldName,
                    displayName: rf.displayName || rf.fieldName,
                    fieldGroup: rf.fieldGroup || 'CONDITION',
                    value: String(rf.value ?? ''),
                    dataType: rf.dataType || 'TEXT_SHORT',
                    supportedValues: Array.isArray(rf.supportedValues) ? rf.supportedValues : (rf.fieldName === 'comparison_operator' ? [">", ">=", "<", "<=", "=="] : []),
                    displayOrder: rf.displayOrder ?? fIdx,
                    isRequired: rf.isRequired !== false,
                    sochiotFieldName: rf.sochiotFieldName || rf.fieldName
                  })) : []
                }));

                const baseDevicePayload = {
                  name: registerForm.name.trim(),
                  category: registerForm.category || 'ENERGY_METER',
                  sochiotDeviceIds: parsedSochiotIds,
                  moduleIds: parsedModuleIds,
                  serialNumber: registerForm.serialNumber ? registerForm.serialNumber.trim() : null,
                  sochiotTemplateId: registerForm.sochiotTemplateId ? Number(registerForm.sochiotTemplateId) : (editingDevice?.sochiotTemplateId || null),
                  templateName: null,
                  description: registerForm.description ? registerForm.description.trim() : null,
                  areaId: (registerForm.areaId && activeAreas.some(a => String(a.id) === String(registerForm.areaId))) ? parseInt(registerForm.areaId, 10) : null,
                  buildingId: (registerForm.buildingId && activeBuildings.some(b => String(b.id) === String(registerForm.buildingId))) ? parseInt(registerForm.buildingId, 10) : null,
                  floorNo: (registerForm.floorNo !== '' && registerForm.floorNo !== null && registerForm.floorNo !== undefined && !isNaN(parseInt(registerForm.floorNo, 10))) ? parseInt(registerForm.floorNo, 10) : null,
                  roomNo: (registerForm.roomNo !== '' && registerForm.roomNo !== null && registerForm.roomNo !== undefined && !isNaN(parseInt(registerForm.roomNo, 10))) ? parseInt(registerForm.roomNo, 10) : null,
                  energyGroupId: registerForm.energyGroupId ? parseInt(registerForm.energyGroupId, 10) : null,
                  displayOrder: parseInt(registerForm.displayOrder, 10) || 0,
                  isActive: registerForm.isActive !== false,
                  settings: templateSettings,
                  template_settings: templateSettings,
                  rules: formattedRules
                };

                if (registerForm.assetId) {
                  baseDevicePayload.assetId = String(registerForm.assetId);
                }
                if (registerForm.profileId && typeof registerForm.profileId === 'string' && registerForm.profileId.length >= 10 && !registerForm.profileId.includes(' ')) {
                  baseDevicePayload.profileId = registerForm.profileId;
                }

                if (typeof setLoading === 'function') setLoading(true);
                try {
                  await fetchAndStoreSochiotAccessToken();
                  const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type': 'application/json' };
                  let res;
                  if (editingDevice) {
                    const patchPayload = {
                      ...baseDevicePayload,
                      ...(resolvedSiteId ? { siteId: Number(resolvedSiteId) } : {})
                    };

                    const queryParam = resolvedSiteId ? `?siteId=${resolvedSiteId}` : '';
                    const updateUrl = getApiUrl(`/devices/${editingDevice.id}${queryParam}`);
                    res = await fetch(updateUrl, {
                      method: 'PATCH',
                      headers,
                      body: JSON.stringify(patchPayload)
                    });
                  } else {
                    const createPayload = { ...baseDevicePayload };
                    delete createPayload.settings;

                    const createUrl = getApiUrl(`/sites/${resolvedSiteId}/devices/from-template`);
                    res = await fetch(createUrl, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(createPayload)
                    });
                  }

                  if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    const errMsg = errData.error?.message || errData.message || `Server error (${res.status})`;
                    if (typeof showToast === 'function') {
                      showToast('danger', errMsg);
                    }
                    if (typeof setLoading === 'function') setLoading(false);
                    return;
                  }

                  // Success
                  if (typeof showToast === 'function') {
                    showToast('success', editingDevice ? `Device "${registerForm.name}" updated successfully!` : `Device "${registerForm.name}" registered successfully!`);
                  }
                  if (typeof fetchDevices === 'function') {
                    fetchDevices();
                  }

                  if (typeof setSearchTerm === 'function') setSearchTerm('');
                  if (typeof setSelectedBuildingFilter === 'function') setSelectedBuildingFilter('ALL');
                  if (typeof setSelectedAreaFilter === 'function') setSelectedAreaFilter('ALL');

                  onHide();
                } catch (err) {
                  if (typeof showToast === 'function') {
                    showToast('danger', err.message || 'Error saving device');
                  }
                }
                if (typeof setLoading === 'function') setLoading(false);
              }}
              disabled={loading}
              className="wizard-btn-primary"
            >
              {loading ? <Spinner animation="border" size="sm" /> : (editingDevice ? 'Update Device' : 'Register Device')}
            </button>
          )}
        </div>
      </Offcanvas.Body>
    </Offcanvas>

    {/* Threshold Limits Modal */}
    <Modal
      show={thresholdModalIndex !== null}
      onHide={handleCloseThresholdModal}
      centered
      size="lg"
      className="glass-modal threshold-config-modal"
    >
      {thresholdModalIndex !== null && (() => {
        const activeRow = dynamicTemplateFields[thresholdModalIndex] || {};
        const paramName = activeRow.displayName || activeRow.sochiotFieldName || 'Telemetry Metric';
        const paramUnit = activeRow.unit || '';

        return (
          <>
            <Modal.Header closeButton className="border-secondary border-opacity-25 px-4 py-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 p-2 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#fbbf24'
                  }}
                >
                  <Sliders size={20} />
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="fw-bold fs-15 text-white">Configure Threshold Limits</span>
                  <Badge
                    bg="transparent"
                    className="border border-info border-opacity-40 text-info fw-semibold px-2 py-0.5 fs-11 font-monospace"
                    style={{ background: 'rgba(14, 165, 233, 0.12)' }}
                  >
                    {paramName}{paramUnit ? ` (${paramUnit})` : ''}
                  </Badge>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body className="p-4 d-flex flex-column gap-3">
              <Row className="g-3">
                {/* 1. Upper Thresholds Card */}
                <Col xs={12} md={6}>
                  <div className="threshold-section-card upper h-100">
                    <div className="d-flex align-items-center gap-1.5 mb-3">
                      <ArrowUpRight size={16} className="text-warning" />
                      <span className="fs-13 fw-bold text-white">Upper Limits</span>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {/* Warning High */}
                      <Form.Group>
                        <Form.Label className="fs-12 fw-semibold threshold-label d-flex align-items-center gap-1.5 mb-1.5">
                          <span className="alert-dot amber" /> Warning High
                        </Form.Label>
                        <InputGroup size="sm" className="threshold-input-group">
                          <Form.Control
                            type="number"
                            value={thresholdDraft.warningHigh}
                            onChange={(e) => setThresholdDraft({ ...thresholdDraft, warningHigh: e.target.value })}
                            className="threshold-input font-monospace fs-13"
                            placeholder="Optional"
                          />
                          {paramUnit && <InputGroup.Text>{paramUnit}</InputGroup.Text>}
                        </InputGroup>
                      </Form.Group>

                      {/* Critical High */}
                      <Form.Group>
                        <Form.Label className="fs-12 fw-semibold threshold-label d-flex align-items-center gap-1.5 mb-1.5">
                          <span className="alert-dot red" /> Critical High
                        </Form.Label>
                        <InputGroup size="sm" className="threshold-input-group">
                          <Form.Control
                            type="number"
                            value={thresholdDraft.criticalHigh}
                            onChange={(e) => setThresholdDraft({ ...thresholdDraft, criticalHigh: e.target.value })}
                            className="threshold-input font-monospace fs-13"
                            placeholder="Optional"
                          />
                          {paramUnit && <InputGroup.Text>{paramUnit}</InputGroup.Text>}
                        </InputGroup>
                      </Form.Group>
                    </div>
                  </div>
                </Col>

                {/* 2. Lower Thresholds Card */}
                <Col xs={12} md={6}>
                  <div className="threshold-section-card lower h-100">
                    <div className="d-flex align-items-center gap-1.5 mb-3">
                      <ArrowDownRight size={16} className="text-info" />
                      <span className="fs-13 fw-bold text-white">Lower Limits</span>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {/* Warning Low */}
                      <Form.Group>
                        <Form.Label className="fs-12 fw-semibold threshold-label d-flex align-items-center gap-1.5 mb-1.5">
                          <span className="alert-dot amber" /> Warning Low
                        </Form.Label>
                        <InputGroup size="sm" className="threshold-input-group">
                          <Form.Control
                            type="number"
                            value={thresholdDraft.warningLow}
                            onChange={(e) => setThresholdDraft({ ...thresholdDraft, warningLow: e.target.value })}
                            className="threshold-input font-monospace fs-13"
                            placeholder="Optional"
                          />
                          {paramUnit && <InputGroup.Text>{paramUnit}</InputGroup.Text>}
                        </InputGroup>
                      </Form.Group>

                      {/* Critical Low */}
                      <Form.Group>
                        <Form.Label className="fs-12 fw-semibold threshold-label d-flex align-items-center gap-1.5 mb-1.5">
                          <span className="alert-dot red" /> Critical Low
                        </Form.Label>
                        <InputGroup size="sm" className="threshold-input-group">
                          <Form.Control
                            type="number"
                            value={thresholdDraft.criticalLow}
                            onChange={(e) => setThresholdDraft({ ...thresholdDraft, criticalLow: e.target.value })}
                            className="threshold-input font-monospace fs-13"
                            placeholder="Optional"
                          />
                          {paramUnit && <InputGroup.Text>{paramUnit}</InputGroup.Text>}
                        </InputGroup>
                      </Form.Group>
                    </div>
                  </div>
                </Col>

                {/* 3. Behavior & Telemetry Card */}
                <Col xs={12}>
                  <div className="threshold-section-card flags">
                    <div className="d-flex align-items-center gap-1.5 mb-2.5">
                      <Cpu size={15} className="text-primary" />
                      <span className="fs-13 fw-bold text-white">Telemetry &amp; Tracking</span>
                    </div>

                    <div className="d-flex flex-column gap-2">
                      <div className="threshold-toggle-row d-flex align-items-center justify-content-between py-2.5 px-3">
                        <div className="d-flex align-items-center gap-2">
                          <Zap size={16} className="text-warning flex-shrink-0" />
                          <span className="fs-12 fw-semibold text-white">Cumulative Metric Tracking</span>
                          <span className="badge bg-warning bg-opacity-20 text-warning fs-10 font-monospace">
                            {paramUnit || 'kWh / m³'}
                          </span>
                        </div>
                        <Form.Check
                          type="switch"
                          id="modal-toggle-cumulative"
                          checked={Boolean(thresholdDraft.isCumulative)}
                          onChange={(e) => setThresholdDraft({ ...thresholdDraft, isCumulative: e.target.checked })}
                          className="fs-14 ms-3 cursor-pointer"
                        />
                      </div>

                      <div className="threshold-toggle-row d-flex align-items-center justify-content-between py-2.5 px-3">
                        <div className="d-flex align-items-center gap-2">
                          <Activity size={16} className="text-info flex-shrink-0" />
                          <span className="fs-12 fw-semibold text-white">Live Telemetry Collection</span>
                        </div>
                        <Form.Check
                          type="switch"
                          id="modal-toggle-telemetry"
                          checked={thresholdDraft.isTelemetry !== false}
                          onChange={(e) => setThresholdDraft({ ...thresholdDraft, isTelemetry: e.target.checked })}
                          className="fs-14 ms-3 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Modal.Body>

            <Modal.Footer className="border-secondary border-opacity-25 px-4 py-3 d-flex align-items-center justify-content-between">
              <button
                type="button"
                onClick={handleClearThresholdDraft}
                className="btn btn-sm btn-outline-secondary border-opacity-50 text-slate-400 d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-12 rounded-2"
                title="Reset all threshold numbers to empty"
              >
                <RotateCcw size={12} /> Clear Thresholds
              </button>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseThresholdModal}
                  className="wizard-btn-cancel px-3.5 py-1.5 fs-12 rounded-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveThresholdDraft}
                  className="wizard-btn-primary d-inline-flex align-items-center gap-1.5 px-4 py-1.5 fs-12 fw-semibold rounded-2"
                >
                  <Check size={14} /> Save Threshold Limits
                </button>
              </div>
            </Modal.Footer>
          </>
        );
      })()}
    </Modal>
    </>
  );
};

export default RegisterDeviceModal;

